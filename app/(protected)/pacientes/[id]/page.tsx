import { createClient } from '@/lib/supabase/server'
import ClientPatientDetail from './ClientPatientDetail'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ficha del Paciente',
}

export default async function PatientFilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Intentamos obtener el paciente del servidor
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  // Si no existe en el servidor, puede ser un paciente creado offline
  // que solo vive en IndexedDB por ahora. El Client Component lo buscará.
  
  return (
    <div className="space-y-6">
      <ClientPatientDetail 
        patientId={id} 
        initialPatient={patient || null} 
        doctorId={user.id} 
      />
    </div>
  )
}
