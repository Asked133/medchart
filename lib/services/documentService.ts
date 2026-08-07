import { getBrowserSupabase } from '@/lib/supabase/browser'
import imageCompression from 'browser-image-compression'
import { db } from '@/lib/db/localDb'
import type { DocumentType } from '@/lib/supabase/database.types'

export interface SaveDocumentOptions {
  patientId: string
  doctorId: string
  documentType: DocumentType
  content: Record<string, any>
  images: File[]
  isOnline: boolean
}

export interface SaveDocumentResult {
  docId: string
  savedOnline: boolean
}

export async function saveClinicalDocument({
  patientId,
  doctorId,
  documentType,
  content,
  images,
  isOnline,
}: SaveDocumentOptions): Promise<SaveDocumentResult> {
  const docId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Extraer fecha_nacimiento si es una Historia Clínica
  const dob = documentType === 'historia_clinica' ? content?.ficha_identificacion?.fecha_nacimiento : undefined

  // 1. Comprimir imágenes con browser-image-compression
  const compressedImages: { file: File; id: string; name: string }[] = []
  const compressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.7,
  }

  for (const img of images) {
    const compressedFile = await imageCompression(img, compressionOptions)
    compressedImages.push({
      file: compressedFile,
      id: crypto.randomUUID(),
      name: `${crypto.randomUUID()}.jpg`,
    })
  }

  let savedOnline = false
  let docInsertedOnline = false

  // 2. Intentar guardar en Supabase si estamos online
  if (isOnline) {
    try {
      const supabase = getBrowserSupabase()

      if (dob) {
        const { error: dobError } = await supabase.from('patients').update({ date_of_birth: dob }).eq('id', patientId)
        if (dobError) console.warn('[documentService] No se pudo actualizar date_of_birth:', dobError.message)
      }

      // Guardar en clinical_documents
      const { error: insertError } = await supabase.from('clinical_documents').insert({
        id: docId,
        patient_id: patientId,
        doctor_id: doctorId,
        document_type: documentType,
        document_date: now,
        content: content as any,
      })

      if (insertError) throw insertError
      docInsertedOnline = true

      // Subir imágenes a Storage y registrar en document_attachments
      for (const img of compressedImages) {
        const storagePath = `${doctorId}/${patientId}/${docId}/${img.name}`
        const { error: uploadError } = await supabase.storage
          .from('clinical-attachments')
          .upload(storagePath, img.file, { contentType: 'image/jpeg' })

        if (uploadError) throw uploadError

        await supabase.from('document_attachments').insert({
          id: img.id,
          document_id: docId,
          doctor_id: doctorId,
          storage_path: storagePath,
          file_name: img.name,
        })
      }

      savedOnline = true
    } catch (err) {
      console.warn('[documentService] Guardado en línea falló, guardando localmente:', err)
      savedOnline = false
    }
  }

  // 3. Actualizar fecha de nacimiento localmente en Dexie si viene informada
  if (dob) {
    const pPat = await db.pending_patients.get(patientId)
    if (pPat) await db.pending_patients.update(patientId, { date_of_birth: dob })
    const cPat = await db.cached_patients.get(patientId)
    if (cPat) await db.cached_patients.update(patientId, { date_of_birth: dob })
  }

  // 4. Fallback a Dexie (IndexedDB)
  if (docInsertedOnline && !savedOnline) {
    // El documento SÍ se insertó en Supabase pero falló alguna imagen.
    // Cacheamos el documento remote y guardamos solo los adjuntos como pendientes.
    await db.cached_documents.put({
      id: docId,
      patient_id: patientId,
      doctor_id: doctorId,
      document_type: documentType,
      document_date: now,
      content,
      created_at: now,
      cached_at: now,
    })

    for (const img of compressedImages) {
      await db.pending_attachments.put({
        id: img.id,
        document_id: docId,
        doctor_id: doctorId,
        file_name: img.name,
        file_blob: img.file,
        sync_status: 'pending',
        created_at_local: now,
      })
    }
  } else if (!savedOnline) {
    // Offline total o falló la inserción del documento principal: va todo a pending
    await db.pending_documents.put({
      id: docId,
      patient_id: patientId,
      doctor_id: doctorId,
      document_type: documentType,
      document_date: now,
      content,
      sync_status: 'pending',
      created_at_local: now,
    })

    for (const img of compressedImages) {
      await db.pending_attachments.put({
        id: img.id,
        document_id: docId,
        doctor_id: doctorId,
        file_name: img.name,
        file_blob: img.file,
        sync_status: 'pending',
        created_at_local: now,
      })
    }
  }

  return { docId, savedOnline }
}
