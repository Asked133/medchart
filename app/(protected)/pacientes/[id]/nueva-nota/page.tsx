import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotaEvolucionForm from './NotaEvolucionForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nueva Nota de Evolución',
}

export default async function NuevaNotaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Intentamos obtener los datos básicos del paciente (si existe en el servidor).
  // Si no hay conexión o el paciente es "nuevo offline", esto regresará null/fallará.
  // El cliente (NotaEvolucionForm) se encargará del fallback a IndexedDB si es necesario.
  const { data: patient } = await supabase
    .from('patients')
    .select('id, full_name, date_of_birth')
    .eq('id', id)
    .single()

  return (
    <div className="space-y-6">
      <NotaEvolucionForm 
        patientId={id} 
        doctorId={user.id} 
        initialPatient={patient || null} 
      />
    </div>
  )
}
