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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-0">
        
        {/* Header con icono destacado */}
        <div className="p-6 border-b border-slate-800 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <FileText className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Borrador Encontrado
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Tienes un borrador sin guardar registrado <span className="text-blue-300 font-medium">{formattedTime}</span>.
          </p>
        </div>

        {/* Body informativo */}
        <div className="p-6 space-y-3 bg-slate-950/40">
          <p className="text-xs text-slate-300 leading-relaxed">
            ¿Deseas continuar editando la información que tenías capturada o prefieres descartar el borrador y comenzar de cero?
          </p>
        </div>

        {/* Botones de acción */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onStartFresh}
            className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Empezar de cero
          </button>
          
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Continuar borrador
          </button>
        </div>

      </div>
    </div>
  )
}
