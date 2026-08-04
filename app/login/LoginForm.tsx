'use client'
// app/login/LoginForm.tsx
// Formulario de login — Client Component para usar useActionState.

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/actions/auth'
import { AlertCircle, Lock, Mail, Stethoscope } from 'lucide-react'

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 mb-4 backdrop-blur-sm">
            <Stethoscope className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            MedChart
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sistema de Historias Clínicas
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-medium text-white mb-6">
            Iniciar sesión
          </h2>

          <form action={action} className="space-y-5">
            {/* Error global */}
            {state?.error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-400/30 rounded-xl p-3 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="medico@clinica.com"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl text-sm
                    bg-white/5 border text-white placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50
                    transition-all duration-200
                    ${state?.fieldErrors?.email
                      ? 'border-red-400/50 bg-red-500/5'
                      : 'border-white/10 hover:border-white/20'
                    }
                  `}
                />
              </div>
              {state?.fieldErrors?.email?.map((e) => (
                <p key={e} className="text-red-400 text-xs mt-1.5">{e}</p>
              ))}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-xl text-sm
                    bg-white/5 border text-white placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50
                    transition-all duration-200
                    ${state?.fieldErrors?.password
                      ? 'border-red-400/50 bg-red-500/5'
                      : 'border-white/10 hover:border-white/20'
                    }
                  `}
                />
              </div>
              {state?.fieldErrors?.password?.map((e) => (
                <p key={e} className="text-red-400 text-xs mt-1.5">{e}</p>
              ))}
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={pending}
              className="
                w-full py-3 px-4 rounded-xl font-medium text-sm
                bg-blue-500 hover:bg-blue-400 active:bg-blue-600
                text-white transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
                shadow-lg shadow-blue-500/20
                mt-2
              "
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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

          {/* Sin enlace de registro — intencional por NOM-004 */}
          <p className="text-center text-xs text-slate-600 mt-6">
            Acceso restringido al personal médico autorizado
          </p>
        </div>
      </div>
    </div>
  )
}
