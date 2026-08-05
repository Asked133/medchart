// app/cuenta-desactivada/page.tsx — Server Component
// Pantalla informativa para médicos con cuenta desactivada.

import type { Metadata } from 'next'
import { logout } from '@/app/actions/auth'
import { ShieldAlert, Stethoscope, UserX } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cuenta desactivada — MedChart',
  description: 'Aviso de cuenta médica desactivada.',
  robots: 'noindex, nofollow',
}

export default function DeactivatedAccountPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Luces de fondo (Ambient background glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center mb-3 shadow-xl backdrop-blur-md">
            <Stethoscope className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MedChart
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Sistema de Historias Clínicas
          </p>
        </div>

        {/* Card de Cuenta Desactivada */}
        <div className="bg-slate-900/95 border-2 border-red-900/40 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-500" />

          <div className="p-7 sm:p-9 text-center flex flex-col items-center">
            {/* UserX Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5 shadow-lg shadow-red-500/10">
              <UserX className="w-8 h-8 text-red-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Acceso Restringido
            </div>

            <h2 className="text-2xl font-bold text-white tracking-wide mb-3">
              Cuenta Desactivada
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-left mb-6">
              Tu cuenta médica ha sido suspendida o desactivada por el administrador del sistema. Durante este estado no es posible acceder a las historias clínicas ni utilizar la plataforma.
            </p>

            <p className="text-xs text-slate-400 mb-6">
              Si consideras que se trata de un error o requieres reactivar tu acceso, ponte en contacto con la administración médica de tu clínica.
            </p>

            <form action={logout} className="w-full">
              <button
                type="submit"
                className="
                  inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold text-sm
                  bg-slate-800 hover:bg-slate-700 active:scale-[0.99]
                  text-slate-200 border border-slate-700 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-slate-500/40
                "
              >
                Cerrar sesión y volver al inicio
              </button>
            </form>

            {/* Footer badge */}
            <div className="mt-7 pt-5 border-t border-slate-800/80 w-full flex justify-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Bloqueo automático de seguridad</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
