// lib/supabase/database.types.ts
// Tipos generados por: npx supabase gen types typescript --project-id <ID> --schema public
// Regenerar cada vez que cambies el esquema en Supabase.
//
// Por ahora es un placeholder tipado manualmente para que el proyecto compile.
// Reemplázalo con la salida real del comando gen types.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DocumentType = 'historia_clinica' | 'nota_evolucion'
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          medical_license: string
          specialty_title: string
          address: string | null
          phone: string | null
          is_founder_account: boolean
          must_change_password: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          medical_license: string
          specialty_title: string
          address?: string | null
          phone?: string | null
          is_founder_account?: boolean
          must_change_password?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          medical_license?: string
          specialty_title?: string
          address?: string | null
          phone?: string | null
          is_founder_account?: boolean
          must_change_password?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          doctor_id: string
          full_name: string
          date_of_birth: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['patients']['Row'], 'full_name' | 'date_of_birth'>>
      }
      clinical_documents: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          document_type: DocumentType
          document_date: string
          content: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clinical_documents']['Row'], 'created_at'>
        // Sin Update: los documentos son inmutables por diseño.
        Update: never
      }
      document_attachments: {
        Row: {
          id: string
          document_id: string
          doctor_id: string
          storage_path: string
          file_name: string
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['document_attachments']['Row'], 'uploaded_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      search_patients: {
        Args: { search_query: string }
        Returns: Database['public']['Tables']['patients']['Row'][]
      }
    }
    Enums: {
      document_type_enum: DocumentType
    }
  }
}
