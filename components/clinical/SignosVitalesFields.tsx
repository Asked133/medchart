'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

interface SignosVitalesFieldsProps {
  prefix?: string
}

export default function SignosVitalesFields({ prefix = 'signos_vitales' }: SignosVitalesFieldsProps) {
  const { register, watch, setValue } = useFormContext()

  const path = (field: string) => (prefix ? `${prefix}.${field}` : field)

  const talla = watch(path('talla'))
  const peso = watch(path('peso'))

  // Auto-cálculo de IMC
  useEffect(() => {
    if (talla && peso) {
      const t = parseFloat(talla)
      const p = parseFloat(peso)
      if (!isNaN(t) && !isNaN(p) && t > 0) {
        const tMetros = t > 3 ? t / 100 : t // Asumir cm si es > 3, si no, metros
        const imc = p / (tMetros * tMetros)
        setValue(path('imc'), imc.toFixed(1))
      }
    }
  }, [talla, peso, setValue, prefix])

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider border-b border-border-subtle pb-2">
        Signos vitales y somatometría
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Talla (m o cm)</label>
          <input
            {...register(path('talla'))}
            placeholder="ej. 1.70"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Peso (kg)</label>
          <input
            {...register(path('peso'))}
            placeholder="ej. 70"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">IMC</label>
          <input
            {...register(path('imc'))}
            placeholder="Auto"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">FC (lpm)</label>
          <input
            {...register(path('fc'))}
            placeholder="ej. 80"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Temperatura (°C)</label>
          <input
            {...register(path('temperatura'))}
            placeholder="ej. 36.5"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">FR (rpm)</label>
          <input
            {...register(path('fr'))}
            placeholder="ej. 16"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Tensión arterial</label>
          <input
            {...register(path('tension_arterial'))}
            placeholder="ej. 120/80"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Saturación (%)</label>
          <input
            {...register(path('saturacion'))}
            placeholder="ej. 98"
            className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
          />
        </div>
      </div>
    </div>
  )
}
