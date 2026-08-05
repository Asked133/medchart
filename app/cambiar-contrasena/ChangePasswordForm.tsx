'use client'

import { useActionState } from 'react'
import { changePassword, type ChangePasswordState } from '@/app/actions/auth'
import { AlertCircle, KeyRound, Lock, ShieldCheck, Stethoscope } from 'lucide-react'

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    null
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Luces de fondo (Ambient background glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/25 to-indigo-500/25 border border-blue-400/40 flex items-center justify-center mb-3 shadow-xl shadow-blue-500/15 backdrop-blur-md">
            <Stethoscope className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MedChart
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Sistema de Historias Clínicas
          </p>
        </div>

        {/* Card destacada con fuerte separación del fondo */}
        <div className="bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

          <div className="p-7 sm:p-9">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Nueva Contraseña
              </h2>
              <span className="text-xs font-semibold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
                Cambio Obligatorio
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Por razones de seguridad y privacidad médica, debes definir una contraseña personal que solo tú conozcas antes de acceder a la plataforma.
            </p>

            <form action={action} className="space-y-5">
              {/* Error global */}
              {state?.error && (
                <div className="flex items-start gap-3 bg-red-500/15 border border-red-500/40 rounded-xl p-3.5 text-red-200 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Nueva Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2"
                >
                  Nueva contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    className={`
                      w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder:text-slate-400
                      bg-slate-950 border-2 transition-all duration-200 shadow-md
                      focus:outline-none focus:ring-4 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-slate-950
                      ${state?.fieldErrors?.password
                        ? 'border-red-500/80 bg-red-950/30 text-red-100 focus:border-red-500'
                        : 'border-slate-700 hover:border-slate-500'
                      }
                    `}
                  />
                </div>
                {state?.fieldErrors?.password?.map((e) => (
                  <p key={e} className="text-red-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <span>•</span> {e}
                  </p>
                ))}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2"
                >
                  Confirmar nueva contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    className={`
                      w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium text-white placeholder:text-slate-400
                      bg-slate-950 border-2 transition-all duration-200 shadow-md
                      focus:outline-none focus:ring-4 focus:ring-blue-500/25 focus:border-blue-400 focus:bg-slate-950
                      ${state?.fieldErrors?.confirmPassword
                        ? 'border-red-500/80 bg-red-950/30 text-red-100 focus:border-red-500'
                        : 'border-slate-700 hover:border-slate-500'
                      }
                    `}
                  />
                </div>
                {state?.fieldErrors?.confirmPassword?.map((e) => (
                  <p key={e} className="text-red-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <span>•</span> {e}
                  </p>
                ))}
              </div>

              {/* Submit Button */}
              <button
                id="btn-change-password"
                type="submit"
                disabled={pending}
                className="
                  w-full py-3.5 px-4 rounded-xl font-bold text-base tracking-wide
                  bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99]
                  text-white transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                  focus:outline-none focus:ring-4 focus:ring-blue-500/40
                  shadow-lg shadow-blue-500/30
                  mt-2
                "
              >
                {pending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Actualizando contraseña…
                  </span>
                ) : (
                  'Guardar e ingresar'
                )}
              </button>
            </form>

            {/* Restringido / Seguridad */}
            <div className="mt-8 pt-5 border-t border-slate-800 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-slate-800 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Protegido con encriptación Supabase Auth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
