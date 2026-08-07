'use client'

import { FileText, RotateCcw, Sparkles } from 'lucide-react'

interface DraftPromptModalProps {
  isOpen: boolean
  formattedTime: string
  onContinue: () => void
  onStartFresh: () => void
}

export default function DraftPromptModal({
  isOpen,
  formattedTime,
  onContinue,
  onStartFresh,
}: DraftPromptModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md overflow-hidden shadow-clinical space-y-0">
        
        {/* Header con icono destacado */}
        <div className="p-6 border-b border-border-subtle text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-3">
            <FileText className="w-7 h-7 text-brand-text" />
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            Borrador Encontrado
          </h3>
          <p className="text-sm text-foreground-muted mt-1">
            Tienes un borrador sin guardar registrado <span className="text-brand-text font-medium">{formattedTime}</span>.
          </p>
        </div>

        {/* Body informativo */}
        <div className="p-6 space-y-3 bg-surface-hover/50">
          <p className="text-xs text-foreground-muted leading-relaxed">
            ¿Deseas continuar editando la información que tenías capturada o prefieres descartar el borrador y comenzar de cero?
          </p>
        </div>

        {/* Botones de acción */}
        <div className="p-6 bg-surface border-t border-border-subtle flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onStartFresh}
            className="flex-1 px-4 py-3 border border-border-strong text-foreground-muted rounded-xl hover:bg-surface-hover hover:text-foreground transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Empezar de cero
          </button>
          
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl transition-colors text-sm font-medium shadow-clinical-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Continuar borrador
          </button>
        </div>

      </div>
    </div>
  )
}
