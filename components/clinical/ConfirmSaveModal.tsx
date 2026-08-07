'use client'

import { AlertCircle } from 'lucide-react'

interface ConfirmSaveModalProps {
  isOpen: boolean
  isSaving: boolean
  errorMessage?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmSaveModal({
  isOpen,
  isSaving,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmSaveModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md overflow-hidden shadow-clinical p-6 space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-medium text-foreground tracking-tight">¿Guardar documento?</h3>
        </div>
        
        <p className="text-foreground-muted text-sm leading-relaxed">
          Este documento <strong className="text-red-500 font-semibold">no podrá editarse ni eliminarse</strong> después de guardarlo. ¿Deseas continuar?
        </p>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-border-strong text-foreground-muted rounded-lg hover:bg-surface-hover hover:text-foreground transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors text-sm font-medium disabled:opacity-50 flex justify-center items-center gap-2 shadow-clinical-sm"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isSaving ? 'Guardando...' : 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
