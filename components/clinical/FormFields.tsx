'use client'

// components/clinical/FormFields.tsx
// Componentes de formulario compartidos que leen del FormProvider vía useFormContext().
// Al estar fuera del componente padre no se re-crean en cada render,
// evitando pérdida de foco y mejorando el rendimiento.

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'

const INPUT_CLASS =
  'block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm ' +
  'transition-colors'

// ─── TextInput ───────────────────────────────────────────────────────────────
export function FormTextInput({
  name,
  label,
  placeholder = '',
  required = false,
  readOnly = false,
}: {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  readOnly?: boolean
}) {
  const { register, formState: { errors } } = useFormContext()

  // Navega el objeto de errores anidado por el path "a.b.c"
  const getNestedError = (path: string) => {
    return path.split('.').reduce((acc: any, key) => acc?.[key], errors)
  }
  const error = getNestedError(name)

  return (
    <div>
      <label className="block text-xs font-medium text-foreground-muted mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        {...register(name)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`${INPUT_CLASS} ${readOnly ? 'opacity-70 bg-surface-active cursor-not-allowed text-foreground-muted' : ''}`}
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
      <label className="block text-xs font-medium text-foreground-muted mb-1">{label}</label>
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
      <label className="block text-xs font-medium text-foreground-muted mb-1">
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
    <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-clinical-sm">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-hover transition-colors"
      >
        <span className="text-base font-semibold text-foreground tracking-tight">{title}</span>
        {isExpanded
          ? <ChevronUp className="w-5 h-5 text-foreground-muted" />
          : <ChevronDown className="w-5 h-5 text-foreground-muted" />
        }
      </button>
      {isExpanded && (
        <div className="p-5 border-t border-border-subtle space-y-4 bg-background/30">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── TextArea de Nota de Evolución (bloque SOAP con tarjeta) ─────────────────
// Versión con card bg-surface para NotaEvolucionForm
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
    <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-2 shadow-clinical-sm">
      <label className="block text-sm font-semibold text-foreground uppercase tracking-wide">
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
