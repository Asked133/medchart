import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentView from './DocumentView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documento Clínico',
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id, docId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Intentamos obtener el paciente
  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name')
    .eq('id', id)
    .single()

  // Intentamos obtener el documento (si está sincronizado)
  const { data: document } = await supabase
    .from('clinical_documents')
    .select('*')
    .eq('id', docId)
    .single()
    
  // Intentamos obtener los adjuntos
  const { data: attachments } = await supabase
    .from('document_attachments')
    .select('*')
    .eq('document_id', docId)

  return (
    <div className="space-y-6">
      <DocumentView 
        patientId={id}
        docId={docId}
        initialPatient={patient || null}
        initialDocument={document || null}
        initialAttachments={attachments || []}
      />
    </div>
  )
}
