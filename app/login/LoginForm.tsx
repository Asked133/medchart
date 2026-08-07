'use client'
// app/login/LoginForm.tsx
// Formulario de login — Client Component para usar useActionState.

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/actions/auth'
import { AlertCircle, Lock, Mail, ShieldCheck, Stethoscope } from 'lucide-react'

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Luces de fondo (Ambient background glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-muted border border-brand/20 flex items-center justify-center mb-3 shadow-clinical-sm">
            <Stethoscope className="w-8 h-8 text-brand-text" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            MedChart
          </h1>
          <p className="text-foreground-muted text-sm font-medium mt-1">
            Sistema de Historias Clínicas
          </p>
        </div>

        {/* Card destacada con fuerte separación del fondo */}
        <div className="bg-surface border border-border-strong rounded-2xl shadow-clinical backdrop-blur-xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="h-1.5 w-full bg-brand" />

          <div className="p-7 sm:p-9">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-wide">
                Iniciar sesión
              </h2>
              <span className="text-xs font-semibold text-brand-text bg-brand-muted px-3 py-1 rounded-full border border-brand/20">
                Acceso Médico
              </span>
            </div>

            <form action={action} className="space-y-6">
              {/* Error global */}
              {state?.error && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-500 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Input Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2"
                >
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-brand-text transition-colors pointer-events-none">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="medico@clinica.com"
                    className={`
                      w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium text-foreground placeholder:text-foreground-muted
                      bg-surface border-2 transition-all duration-200 shadow-clinical-sm
                      focus:outline-none focus:ring-4 focus:ring-brand/25 focus:border-brand
                      ${state?.fieldErrors?.email
                        ? 'border-red-500 bg-red-500/5 text-red-500 focus:border-red-500'
                        : 'border-border-strong hover:border-brand/50'
                      }
                    `}
                  />
                </div>
                {state?.fieldErrors?.email?.map((e) => (
                  <p key={e} className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <span>•</span> {e}
                  </p>
                ))}
              </div>

              {/* Input Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2"
                >
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted group-focus-within:text-brand-text transition-colors pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className={`
                      w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium text-foreground placeholder:text-foreground-muted
                      bg-surface border-2 transition-all duration-200 shadow-clinical-sm
                      focus:outline-none focus:ring-4 focus:ring-brand/25 focus:border-brand
                      ${state?.fieldErrors?.password
                        ? 'border-red-500 bg-red-500/5 text-red-500 focus:border-red-500'
                        : 'border-border-strong hover:border-brand/50'
                      }
                    `}
                  />
                </div>
                {state?.fieldErrors?.password?.map((e) => (
                  <p key={e} className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                    <span>•</span> {e}
                  </p>
                ))}
              </div>

              {/* Submit Button */}
              <button
                id="btn-login"
                type="submit"
                disabled={pending}
                className="
                  w-full py-3.5 px-4 rounded-xl font-bold text-base tracking-wide
                  bg-brand hover:bg-brand-hover active:scale-[0.99]
                  text-white transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                  focus:outline-none focus:ring-4 focus:ring-brand/40
                  shadow-clinical-sm
                  mt-2
                "
              >
                {pending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Iniciando sesión…
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            {/* Restringido / Seguridad */}
            <div className="mt-8 pt-5 border-t border-border-subtle text-center">
              <div className="inline-flex items-center gap-1.5 text-xs text-foreground-muted bg-surface-hover px-3.5 py-1.5 rounded-full border border-border-subtle shadow-clinical-sm">
                <ShieldCheck className="w-4 h-4 text-brand-text" />
                <span>Acceso restringido al personal médico autorizado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
