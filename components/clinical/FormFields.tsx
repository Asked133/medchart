'use client'

// components/clinical/FormFields.tsx
// Componentes de formulario compartidos que leen del FormProvider vía useFormContext().
// Al estar fuera del componente padre no se re-crean en cada render,
// evitando pérdida de foco y mejorando el rendimiento.

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'

const INPUT_CLASS =
  'block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ' +
  'transition-colors'

// ─── TextInput ───────────────────────────────────────────────────────────────
export function FormTextInput({
  name,
  label,
  placeholder = '',
  required = false,
}: {
  name: string
  label: string
  placeholder?: string
  required?: boolean
}) {
  const { register, formState: { errors } } = useFormContext()

  // Navega el objeto de errores anidado por el path "a.b.c"
  const getNestedError = (path: string) => {
    return path.split('.').reduce((acc: any, key) => acc?.[key], errors)
  }
  const error = getNestedError(name)

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        {...register(name)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
      {error?.message && (
        <p className="text-red-400 text-xs mt-1">{error.message}</p>
      )}
    </div>
  )
}

// ─── TextArea ────────────────────────────────────────────────────────────────
export function FormTextArea({
  name,
  label,
  rows = 3,
  placeholder = '',
}: {
  name: string
  label: string
  rows?: number
  placeholder?: string
}) {
  const { register } = useFormContext()
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function FormSelect({
  name,
  label,
  options,
  required = false,
}: {
  name: string
  label: string
  options: { label: string; value: string }[]
  required?: boolean
}) {
  const { register } = useFormContext()
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        {...register(name)}
        className={INPUT_CLASS}
      >
        <option value="">-- Seleccionar --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Section (Acordeón) ──────────────────────────────────────────────────────
export function FormSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
}: {
  id: string
  title: string
  isExpanded: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <span className="text-base font-semibold text-slate-200">{title}</span>
        {isExpanded
          ? <ChevronUp className="w-5 h-5 text-slate-400" />
          : <ChevronDown className="w-5 h-5 text-slate-400" />
        }
      </button>
      {isExpanded && (
        <div className="p-5 border-t border-slate-800/50 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── TextArea de Nota de Evolución (bloque SOAP con tarjeta) ─────────────────
// Versión con card bg-slate-900 para NotaEvolucionForm
export function SoapTextArea({
  name,
  label,
  rows = 4,
  placeholder = '',
}: {
  name: string
  label: string
  rows?: number
  placeholder?: string
}) {
  const { register } = useFormContext()
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
      <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  )
}
