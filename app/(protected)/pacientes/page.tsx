import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientPatientSearch from './ClientPatientSearch'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pacientes',
}

export default async function PacientesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Pacientes</h1>
        <p className="text-slate-400 text-sm mt-1">
          Busca un paciente existente o registra uno nuevo.
        </p>
      </div>
      
      {/* 
        Pasamos el doctorId al Client Component para que 
        lo use en búsquedas locales y al crear nuevos pacientes 
      */}
      <ClientPatientSearch doctorId={user.id} />
    </div>
  )
}
