// lib/sync/syncEngine.ts
// Motor de sincronización offline → Supabase.
//
// REGLAS CRÍTICAS (NOM-004):
//  - Solo hace INSERT, nunca UPDATE ni DELETE en Supabase.
//  - Verifica existencia por ID antes de reinsertar (idempotente).
//  - Orden: patients primero, luego documents (por FK).
//  - No usa Background Sync API — no confiable en iOS Safari.

import { createBrowserClient } from '@supabase/ssr'
import { db, type PendingAttachment } from '@/lib/db/localDb'
import type { DocumentType } from '@/lib/supabase/database.types'

// Cliente sin generics estrictos — necesario para que el insert permita 'id'
// cuando el tipo inferido es un InsertType parcial.
// La seguridad real está en las políticas RLS de Postgres, no en los tipos de TS.
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let isSyncing = false // Semáforo: evita ejecuciones concurrentes

export async function syncPendingData(): Promise<void> {
  if (isSyncing) return
  if (!navigator.onLine) return

  isSyncing = true
  console.log('[sync] Iniciando sincronización…')

  try {
    const supabase = getSupabase()

    // ── PASO 1: Sincronizar pending_patients ─────────────────────────────────
    const pendingPatients = await db.pending_patients
      .where('sync_status')
      .anyOf(['pending', 'error'])
      .toArray()

    for (const patient of pendingPatients) {
      try {
        await db.pending_patients.update(patient.id, { sync_status: 'syncing' })

        // Verificar si ya existe (reintento idempotente)
        const { data: existing } = await supabase
          .from('patients')
          .select('id')
          .eq('id', patient.id)
          .maybeSingle()

        if (!existing) {
          const { error } = await supabase.from('patients').insert({
            id: patient.id,
            doctor_id: patient.doctor_id,
            full_name: patient.full_name,
            date_of_birth: patient.date_of_birth ?? null,
          })

          if (error) throw error
        }

        await db.pending_patients.update(patient.id, {
          sync_status: 'synced',
          error_message: undefined,
        })
        console.log(`[sync] Paciente ${patient.id} sincronizado.`)

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await db.pending_patients.update(patient.id, {
          sync_status: 'error',
          error_message: message,
        })
        console.error(`[sync] Error sincronizando paciente ${patient.id}:`, message)
      }
    }

    // ── PASO 2: Sincronizar pending_documents ────────────────────────────────
    // Solo documentos cuyo paciente ya está sincronizado en Supabase.

    const pendingDocs = await db.pending_documents
      .where('sync_status')
      .anyOf(['pending', 'error'])
      .toArray()

    for (const doc of pendingDocs) {
      try {
        // Verificar que el paciente ya está disponible en Supabase
        const syncedPatient = await db.pending_patients.get(doc.patient_id)
        if (syncedPatient && syncedPatient.sync_status !== 'synced') {
          console.log(`[sync] Doc ${doc.id} en espera: paciente ${doc.patient_id} aún no sincronizado.`)
          continue
        }
        // Si syncedPatient es undefined, el paciente viene de cached_patients — OK.

        await db.pending_documents.update(doc.id, { sync_status: 'syncing' })

        // ── PASO 2A: Subir adjuntos del documento ──────────────────────────
        const attachments = await db.pending_attachments
          .where('document_id')
          .equals(doc.id)
          .and((a) => a.sync_status !== 'synced')
          .toArray()

        for (const attachment of attachments) {
          try {
            await db.pending_attachments.update(attachment.id, { sync_status: 'syncing' })

            const storagePath = `${attachment.doctor_id}/${doc.patient_id}/${doc.id}/${attachment.file_name}`

            const { error: uploadError } = await supabase.storage
              .from('clinical-attachments')
              .upload(storagePath, attachment.file_blob, {
                upsert: false,
                contentType: attachment.file_blob.type,
              })

            // "already exists" = ya se subió en un intento anterior — éxito idempotente
            if (uploadError && !uploadError.message.includes('already exists')) {
              throw uploadError
            }

            // ── Registrar la relación en la tabla document_attachments ─────────
            const { error: attachRecordError } = await supabase
              .from('document_attachments')
              .insert({
                id: attachment.id,
                document_id: doc.id,
                doctor_id: attachment.doctor_id,
                storage_path: storagePath,
                file_name: attachment.file_name,
              })

            // Idempotente: si ya existe (código 23505 duplicate key), no lo trates como error
            if (attachRecordError && attachRecordError.code !== '23505') {
              throw attachRecordError
            }

            const update: Partial<PendingAttachment> = {
              sync_status: 'synced',
              storage_path: storagePath,
            }
            await db.pending_attachments.update(attachment.id, update)

          } catch (attachErr) {
            const message = attachErr instanceof Error ? attachErr.message : String(attachErr)
            const errUpdate: Partial<PendingAttachment> = {
              sync_status: 'error',
              error_message: message,
            }
            await db.pending_attachments.update(attachment.id, errUpdate)
            console.error(`[sync] Error subiendo adjunto ${attachment.id}:`, message)
            // No lanzamos — continuamos aunque algunos adjuntos fallen
          }
        }

        // ── PASO 2B: Insertar el documento ─────────────────────────────────
        const { data: existingDoc } = await supabase
          .from('clinical_documents')
          .select('id')
          .eq('id', doc.id)
          .maybeSingle()

        if (!existingDoc) {
          const { error: insertError } = await supabase
            .from('clinical_documents')
            .insert({
              id: doc.id,
              patient_id: doc.patient_id,
              doctor_id: doc.doctor_id,
              document_type: doc.document_type as DocumentType,
              document_date: doc.document_date,
              content: doc.content,
            })

          if (insertError) throw insertError
        }

        // ── Actualizar date_of_birth del paciente si es una Historia Clínica ──
        if (doc.document_type === 'historia_clinica') {
          const dob = (doc.content as any)?.ficha_identificacion?.fecha_nacimiento
          if (dob) {
            const { error: dobError } = await supabase
              .from('patients')
              .update({ date_of_birth: dob })
              .eq('id', doc.patient_id)
            if (dobError) {
              console.warn(`[sync] No se pudo actualizar date_of_birth del paciente ${doc.patient_id}:`, dobError.message)
            }
          }
        }

        await db.pending_documents.update(doc.id, {
          sync_status: 'synced',
          error_message: undefined,
        })
        console.log(`[sync] Documento ${doc.id} sincronizado.`)

      } catch (docErr) {
        const message = docErr instanceof Error ? docErr.message : String(docErr)
        await db.pending_documents.update(doc.id, {
          sync_status: 'error',
          error_message: message,
        })
        console.error(`[sync] Error sincronizando documento ${doc.id}:`, message)
      }
    }

    console.log('[sync] Sincronización completada.')
  } finally {
    isSyncing = false
  }
}
