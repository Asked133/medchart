'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { db, type CachedPatient, type PendingPatient } from '@/lib/db/localDb'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { saveClinicalDocument } from '@/lib/services/documentService'
import SignosVitalesFields from '@/components/clinical/SignosVitalesFields'
import ImageAttachmentUploader from '@/components/clinical/ImageAttachmentUploader'
import ConfirmSaveModal from '@/components/clinical/ConfirmSaveModal'
import DraftPromptModal from '@/components/clinical/DraftPromptModal'
import { Save, WifiOff } from 'lucide-react'

// ─── ESQUEMA ZOD NOTA DE EVOLUCIÓN ──────────────────────────────────────────
const notaEvolucionSchema = z.object({
  padecimiento_actual: z.string().optional(),
  exploracion_fisica: z.string().optional(),
  signos_vitales: z.object({
    talla: z.string().optional(),
    peso: z.string().optional(),
    imc: z.string().optional(),
    fc: z.string().optional(),
    temperatura: z.string().optional(),
    fr: z.string().optional(),
    tension_arterial: z.string().optional(),
    saturacion: z.string().optional(),
  }),
  plan_y_tratamiento: z.string().optional(),
  estudios: z.string().optional(),
})

type FormData = z.infer<typeof notaEvolucionSchema>

export default function NotaEvolucionForm({
  patientId,
  doctorId,
  initialPatient,
}: {
  patientId: string
  doctorId: string
  initialPatient: { id: string; full_name: string; date_of_birth?: string | null } | null
}) {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [patient, setPatient] = useState<CachedPatient | PendingPatient | null>(null)

  const [images, setImages] = useState<File[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [pendingDraft, setPendingDraft] = useState<{ data: any; savedAt: string } | null>(null)

  const DRAFT_KEY = `medchart_draft_nota_${patientId}`

  const methods = useForm<FormData>({
    resolver: zodResolver(notaEvolucionSchema),
    defaultValues: {
      padecimiento_actual: '',
      exploracion_fisica: '',
      plan_y_tratamiento: '',
      estudios: '',
    },
  })

  // 1. Cargar paciente y verificar si hay borrador previo
  useEffect(() => {
    async function loadPatient() {
      let pat: CachedPatient | PendingPatient | null = initialPatient as CachedPatient | null
      if (!pat) {
        pat = await db.pending_patients.get(patientId) || await db.cached_patients.get(patientId) || null
      }
      if (pat) setPatient(pat)

      try {
        const savedDraft = localStorage.getItem(DRAFT_KEY)
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft)
          if (parsed?.data) {
            setPendingDraft({
              data: parsed.data,
              savedAt: parsed.savedAt || 'recientemente'
            })
          }
        }
      } catch (err) {
        console.warn('Error leyendo borrador de nota:', err)
      }
    }
    loadPatient()
  }, [patientId, initialPatient, methods, DRAFT_KEY])

  // 2. Auto-guardar borrador de TEXTO en localStorage mientras se escribe
  useEffect(() => {
    const subscription = methods.watch((values) => {
      if (!values) return
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          data: values,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
      } catch (e) {}
    })
    return () => subscription.unsubscribe()
  }, [methods.watch, DRAFT_KEY])

  function handleContinueDraft() {
    if (pendingDraft) {
      methods.reset(pendingDraft.data)
      setPendingDraft(null)
    }
  }

  function handleStartFresh() {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch (e) {}
    setPendingDraft(null)
  }

  const onSubmit = () => {
    setShowConfirm(true)
  }

  const handleConfirmSave = async () => {
    setIsSaving(true)
    setSaveError('')

    try {
      const formData = methods.getValues()

      const { docId } = await saveClinicalDocument({
        patientId,
        doctorId,
        documentType: 'nota_evolucion',
        content: formData,
        images,
        isOnline,
      })

      // Eliminar el borrador tras guardar con éxito
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch (e) {}

      router.push(`/pacientes/${patientId}/documentos/${docId}`)
    } catch (error: any) {
      setSaveError(error.message || 'Ocurrió un error inesperado al guardar la nota.')
      setIsSaving(false)
    }
  }

  const TextArea = ({ name, label, rows = 4, placeholder = '' }: { name: any; label: string; rows?: number; placeholder?: string }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
      <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wide">{label}</label>
      <textarea
        {...methods.register(name)}
        rows={rows}
        placeholder={placeholder}
        className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
      />
    </div>
  )

  if (!patient) return <div className="text-center py-10 text-slate-400">Cargando paciente...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Nota de Evolución</h1>
          <p className="text-slate-400 text-sm mt-1">{patient.full_name}</p>
        </div>
        {!isOnline && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <WifiOff className="w-3 h-3" /> Offline Mode
          </span>
        )}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Padecimiento Actual */}
          <TextArea
            name="padecimiento_actual"
            label="Padecimiento Actual"
            placeholder="Motivo de esta consulta de seguimiento..."
            rows={5}
          />

          {/* Exploración Física (Texto libre) */}
          <TextArea
            name="exploracion_fisica"
            label="Exploración Física"
            placeholder="Hallazgos de la exploración física..."
            rows={5}
          />

          {/* Signos Vitales (Sub-componente reutilizable) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <SignosVitalesFields prefix="signos_vitales" />
          </div>

          {/* Plan y Tratamiento */}
          <TextArea
            name="plan_y_tratamiento"
            label="Plan y Tratamiento"
            placeholder="Plan terapéutico y recomendaciones..."
            rows={5}
          />

          {/* Estudios */}
          <TextArea
            name="estudios"
            label="Estudios"
            placeholder="Estudios solicitados o revisados en esta consulta..."
            rows={4}
          />

          {/* Componente Reutilizable de Imágenes */}
          <ImageAttachmentUploader images={images} onChange={setImages} />

          {/* Botón Guardar */}
          <div className="sticky bottom-4 mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-5 h-5" />
              Guardar Nota de Evolución
            </button>
          </div>
        </form>
      </FormProvider>

      {/* Modal Reutilizable de Confirmación */}
      <ConfirmSaveModal
        isOpen={showConfirm}
        isSaving={isSaving}
        errorMessage={saveError}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Modal de Pregunta de Borrador al Abrir la Vista */}
      <DraftPromptModal
        isOpen={!!pendingDraft}
        formattedTime={pendingDraft?.savedAt || ''}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    </div>
  )
}
