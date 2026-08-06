// lib/db/localDb.ts
// Base de datos local con Dexie.js (wrapper de IndexedDB).
// Maneja versionado de esquema para agregar tablas futuras sin romper datos existentes.

import Dexie, { type EntityTable } from 'dexie'
import type { DocumentType } from '@/lib/supabase/database.types'

// ─── Tipos de las tablas locales ────────────────────────────────────────────

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

export interface PendingPatient {
  id: string            // UUID generado en cliente con crypto.randomUUID()
  doctor_id: string
  full_name: string
  date_of_birth?: string
  sync_status: SyncStatus
  created_at_local: string  // ISO string
  error_message?: string
}

export interface PendingDocument {
  id: string            // UUID generado en cliente — mismo id que se usará en Supabase
  patient_id: string    // Puede apuntar a un PendingPatient.id o a un paciente ya synced
  doctor_id: string
  document_type: DocumentType
  document_date: string
  content: Record<string, unknown>
  sync_status: SyncStatus
  created_at_local: string
  error_message?: string
}

export interface PendingAttachment {
  id: string            // UUID generado en cliente
  document_id: string   // FK a PendingDocument.id
  doctor_id: string
  file_name: string
  file_blob: Blob       // Imagen ya comprimida, lista para subir
  sync_status: SyncStatus
  created_at_local: string
  storage_path?: string // Se llena al sincronizar
  error_message?: string
}

// Copias locales de solo lectura (no se vuelven a subir)
export interface CachedPatient {
  id: string
  doctor_id: string
  full_name: string
  date_of_birth?: string
  created_at: string
  cached_at: string
}

export interface CachedDocument {
  id: string
  patient_id: string
  doctor_id: string
  document_type: DocumentType
  document_date: string
  content: Record<string, unknown>
  created_at: string
  cached_at: string
}

export interface DraftDocument {
  id: string            // Clave única: `${patient_id}_${document_type}`
  patient_id: string
  doctor_id: string
  document_type: DocumentType
  content: Record<string, unknown> // Únicamente texto de los campos
  updated_at: string     // ISO string
}

// ─── Clase de base de datos ──────────────────────────────────────────────────

class MedChartDb extends Dexie {
  pending_patients!: EntityTable<PendingPatient, 'id'>
  pending_documents!: EntityTable<PendingDocument, 'id'>
  pending_attachments!: EntityTable<PendingAttachment, 'id'>
  cached_patients!: EntityTable<CachedPatient, 'id'>
  cached_documents!: EntityTable<CachedDocument, 'id'>
  draft_documents!: EntityTable<DraftDocument, 'id'>

  constructor() {
    super('medchart_db')

    // Versión 1 — esquema inicial.
    this.version(1).stores({
      pending_patients:    '&id, doctor_id, sync_status, created_at_local',
      pending_documents:   '&id, patient_id, doctor_id, sync_status, created_at_local',
      pending_attachments: '&id, document_id, doctor_id, sync_status',
      cached_patients:     '&id, doctor_id, full_name, cached_at',
      cached_documents:    '&id, patient_id, doctor_id, document_date, cached_at',
    })

    // Versión 2 — añade tabla de borradores (draft_documents)
    this.version(2).stores({
      pending_patients:    '&id, doctor_id, sync_status, created_at_local',
      pending_documents:   '&id, patient_id, doctor_id, sync_status, created_at_local',
      pending_attachments: '&id, document_id, doctor_id, sync_status',
      cached_patients:     '&id, doctor_id, full_name, cached_at',
      cached_documents:    '&id, patient_id, doctor_id, document_date, cached_at',
      draft_documents:     '&id, patient_id, doctor_id, document_type, updated_at',
    })
  }
}

// Singleton — se instancia una sola vez durante la vida de la app
export const db = new MedChartDb()
