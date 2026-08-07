// app/(protected)/layout.tsx — Layout de rutas protegidas (Server Component)
// Verifica sesión activa, obtiene el perfil del médico y pasa los datos al TopBar.
// Si no hay sesión, el middleware ya redirigió a /login — este check es una segunda capa.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopBar from '@/components/TopBar'
import StaleDataBanner from '@/components/StaleDataBanner'
import SyncManager from '@/components/SyncManager'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtiene el perfil del médico para el TopBar
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, specialty_title')
    .eq('id', user.id)
    .single()

  const profile = profileData as { full_name: string; specialty_title: string } | null

  const doctorName = profile?.full_name ?? 'Médico'
  const specialtyTitle = profile?.specialty_title ?? ''

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Barra superior fija */}
      <TopBar doctorName={doctorName} specialtyTitle={specialtyTitle} />

      {/* Banner de documentos sin sincronizar (> 3 días) */}
      <StaleDataBanner />

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Motor de sincronización — invisible, solo efectos */}
      <SyncManager />
    </div>
  )
}
