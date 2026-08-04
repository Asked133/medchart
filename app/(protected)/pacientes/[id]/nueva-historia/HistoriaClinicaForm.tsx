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
import { ChevronDown, ChevronUp, Save, WifiOff } from 'lucide-react'

// ─── ESQUEMA ZOD (NOM-004) ──────────────────────────────────────────────────
const historiaClinicaSchema = z.object({
  ficha_identificacion: z.object({
    nombre_completo: z.string().min(1, 'El nombre es obligatorio'),
    fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
    genero: z.string().min(1, 'El género es obligatorio'),
    edad: z.string().optional(),
    estado_civil: z.string().optional(),
    nacionalidad: z.string().optional(),
    lugar_nacimiento: z.string().optional(),
    direccion: z.string().optional(),
    escolaridad: z.string().optional(),
    ocupacion: z.string().optional(),
    persona_responsable: z.string().optional(),
  }),
  antecedentes_heredo_familiares: z.string().optional(),
  antecedentes_personales_no_patologicos: z.object({
    alimentacion: z.string().optional(),
    vivienda: z.string().optional(),
    habitos_higienicos_individuales: z.string().optional(),
    tiempo_libre: z.string().optional(),
    inmunizaciones: z.string().optional(),
  }),
  antecedentes_personales_patologicos: z.object({
    infectocontagiosos: z.string().optional(),
    enfermedades_exantematicas: z.string().optional(),
    enfermedades_cronico_degenerativas: z.string().optional(),
    alergias: z.string().optional(),
    quirurgicos: z.string().optional(),
    traumaticos: z.string().optional(),
    convulsivos: z.string().optional(),
    transfusiones: z.string().optional(),
    drogas: z.string().optional(),
    hospitalizaciones_previas: z.string().optional(),
    exposicion_a_biomasa: z.string().optional(),
    factores_de_riesgo_cardiovascular: z.string().optional(),
  }),
  padecimiento_actual: z.string().optional(),
  interrogatorio_aparatos_sistemas: z.object({
    aparato_respiratorio: z.string().optional(),
    aparato_cardiovascular: z.string().optional(),
    aparato_digestivo: z.string().optional(),
    aparato_renal_urinario: z.string().optional(),
    aparato_genital: z.string().optional(),
    endocrino: z.string().optional(),
    hematologico: z.string().optional(),
    piel_y_anexos: z.string().optional(),
    musculo_esqueletico: z.string().optional(),
    sistema_nervioso_central: z.string().optional(),
    organo_de_los_sentidos: z.string().optional(),
    esfera_psiquica: z.string().optional(),
    sintomas_generales: z.string().optional(),
  }),
  exploracion_fisica: z.object({
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
    habitus_exterior: z.string().optional(),
    neurologico: z.string().optional(),
    cabeza: z.string().optional(),
    cara: z.string().optional(),
    ojos: z.string().optional(),
    oido: z.string().optional(),
    nariz: z.string().optional(),
    cavidad_bucal: z.string().optional(),
    cuello: z.string().optional(),
    torax: z.string().optional(),
    region_precordial: z.string().optional(),
    abdomen: z.string().optional(),
    genitales_externos: z.string().optional(),
    extremidades: z.string().optional(),
  }),
  examenes_previos: z.string().optional(),
  diagnosticos: z.string().optional(),
  plan_y_tratamiento: z.string().optional(),
})

type FormData = z.infer<typeof historiaClinicaSchema>

export default function HistoriaClinicaForm({
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
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'ficha_identificacion': true,
    'padecimiento_actual': true,
  })

  const [images, setImages] = useState<File[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const methods = useForm<FormData>({
    resolver: zodResolver(historiaClinicaSchema),
    defaultValues: {
      ficha_identificacion: {
        nombre_completo: '',
        fecha_nacimiento: '',
        genero: '',
      },
    }
  })

  useEffect(() => {
    async function loadPatient() {
      let pat: CachedPatient | PendingPatient | null = initialPatient as CachedPatient | null
      if (!pat) {
        pat = await db.pending_patients.get(patientId) || await db.cached_patients.get(patientId) || null
      }
      if (pat) {
        setPatient(pat)
        methods.setValue('ficha_identificacion.nombre_completo', pat.full_name)
        if (pat.date_of_birth) {
          methods.setValue('ficha_identificacion.fecha_nacimiento', pat.date_of_birth)
        }
      }
    }
    loadPatient()
  }, [patientId, initialPatient, methods])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
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
        documentType: 'historia_clinica',
        content: formData,
        images,
        isOnline,
      })

      router.push(`/pacientes/${patientId}/documentos/${docId}`)
    } catch (error: any) {
      setSaveError(error.message || 'Ocurrió un error inesperado al guardar.')
      setIsSaving(false)
    }
  }

  const TextInput = ({ name, label, placeholder = '' }: { name: any; label: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input
        {...methods.register(name)}
        placeholder={placeholder}
        className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  )
  
  const TextArea = ({ name, label, rows = 3 }: { name: any; label: string; rows?: number }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <textarea
        {...methods.register(name)}
        rows={rows}
        className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  )

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    const isExpanded = expandedSections[id]
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full px-5 py-4 flex items-center justify-between bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
        >
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{title}</h2>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </button>
        {isExpanded && <div className="p-5 border-t border-slate-800/50 space-y-4">{children}</div>}
      </div>
    )
  }

  if (!patient) return <div className="text-center py-10 text-slate-400">Cargando paciente...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Historia Clínica</h1>
          <p className="text-slate-400 text-sm mt-1">{patient.full_name}</p>
        </div>
        {!isOnline && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <WifiOff className="w-3 h-3" /> Offline Mode
          </span>
        )}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          
          <Section id="ficha_identificacion" title="Ficha de Identificación">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre completo *</label>
                <input
                  {...methods.register('ficha_identificacion.nombre_completo')}
                  className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {methods.formState.errors.ficha_identificacion?.nombre_completo && (
                  <p className="text-red-400 text-xs mt-1">{methods.formState.errors.ficha_identificacion.nombre_completo.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de nacimiento *</label>
                <input
                  type="date"
                  {...methods.register('ficha_identificacion.fecha_nacimiento')}
                  className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {methods.formState.errors.ficha_identificacion?.fecha_nacimiento && (
                  <p className="text-red-400 text-xs mt-1">{methods.formState.errors.ficha_identificacion.fecha_nacimiento.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Género *</label>
                <input
                  {...methods.register('ficha_identificacion.genero')}
                  placeholder="Ej. Femenino, Masculino"
                  className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {methods.formState.errors.ficha_identificacion?.genero && (
                  <p className="text-red-400 text-xs mt-1">{methods.formState.errors.ficha_identificacion.genero.message}</p>
                )}
              </div>
              <TextInput name="ficha_identificacion.edad" label="Edad" />
              <TextInput name="ficha_identificacion.estado_civil" label="Estado civil" />
              <TextInput name="ficha_identificacion.nacionalidad" label="Nacionalidad" />
              <TextInput name="ficha_identificacion.lugar_nacimiento" label="Lugar de nacimiento" />
              <TextInput name="ficha_identificacion.direccion" label="Dirección" />
              <TextInput name="ficha_identificacion.escolaridad" label="Escolaridad" />
              <TextInput name="ficha_identificacion.ocupacion" label="Ocupación" />
              <TextInput name="ficha_identificacion.persona_responsable" label="Persona responsable del paciente" />
            </div>
          </Section>

          <Section id="antecedentes_heredo_familiares" title="Antecedentes Heredo-Familiares">
            <TextArea name="antecedentes_heredo_familiares" label="Descripción de antecedentes familiares" rows={4} />
          </Section>

          <Section id="antecedentes_personales_no_patologicos" title="Antecedentes Personales No Patológicos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput name="antecedentes_personales_no_patologicos.alimentacion" label="Alimentación" />
              <TextInput name="antecedentes_personales_no_patologicos.vivienda" label="Vivienda" />
              <TextInput name="antecedentes_personales_no_patologicos.habitos_higienicos_individuales" label="Hábitos higiénicos individuales" />
              <TextInput name="antecedentes_personales_no_patologicos.tiempo_libre" label="Tiempo libre" />
              <TextInput name="antecedentes_personales_no_patologicos.inmunizaciones" label="Inmunizaciones" />
            </div>
          </Section>

          <Section id="antecedentes_personales_patologicos" title="Antecedentes Personales Patológicos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput name="antecedentes_personales_patologicos.infectocontagiosos" label="Infectocontagiosos" />
              <TextInput name="antecedentes_personales_patologicos.enfermedades_exantematicas" label="Enfermedades exantemáticas" />
              <TextInput name="antecedentes_personales_patologicos.enfermedades_cronico_degenerativas" label="Enfermedades crónico degenerativas" />
              <TextInput name="antecedentes_personales_patologicos.alergias" label="Alergias" />
              <TextInput name="antecedentes_personales_patologicos.quirurgicos" label="Quirúrgicos" />
              <TextInput name="antecedentes_personales_patologicos.traumaticos" label="Traumáticos" />
              <TextInput name="antecedentes_personales_patologicos.convulsivos" label="Convulsivos" />
              <TextInput name="antecedentes_personales_patologicos.transfusiones" label="Transfusiones" />
              <TextInput name="antecedentes_personales_patologicos.drogas" label="Drogas" />
              <TextInput name="antecedentes_personales_patologicos.hospitalizaciones_previas" label="Hospitalizaciones previas" />
              <TextInput name="antecedentes_personales_patologicos.exposicion_a_biomasa" label="Exposición a biomasa" />
              <TextInput name="antecedentes_personales_patologicos.factores_de_riesgo_cardiovascular" label="Factores de riesgo cardiovascular" />
            </div>
          </Section>

          <Section id="padecimiento_actual" title="Padecimiento Actual">
            <TextArea name="padecimiento_actual" label="Descripción del padecimiento actual" rows={6} />
          </Section>

          <Section id="interrogatorio_aparatos_sistemas" title="Interrogatorio por Aparatos y Sistemas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput name="interrogatorio_aparatos_sistemas.aparato_respiratorio" label="Aparato respiratorio" />
              <TextInput name="interrogatorio_aparatos_sistemas.aparato_cardiovascular" label="Aparato cardiovascular" />
              <TextInput name="interrogatorio_aparatos_sistemas.aparato_digestivo" label="Aparato digestivo" />
              <TextInput name="interrogatorio_aparatos_sistemas.aparato_renal_urinario" label="Aparato renal y urinario" />
              <TextInput name="interrogatorio_aparatos_sistemas.aparato_genital" label="Aparato genital" />
              <TextInput name="interrogatorio_aparatos_sistemas.endocrino" label="Endocrino" />
              <TextInput name="interrogatorio_aparatos_sistemas.hematologico" label="Hematológico" />
              <TextInput name="interrogatorio_aparatos_sistemas.piel_y_anexos" label="Piel y anexos" />
              <TextInput name="interrogatorio_aparatos_sistemas.musculo_esqueletico" label="Músculo esquelético" />
              <TextInput name="interrogatorio_aparatos_sistemas.sistema_nervioso_central" label="Sistema nervioso central" />
              <TextInput name="interrogatorio_aparatos_sistemas.organo_de_los_sentidos" label="Órgano de los sentidos" />
              <TextInput name="interrogatorio_aparatos_sistemas.esfera_psiquica" label="Esfera psíquica" />
              <TextInput name="interrogatorio_aparatos_sistemas.sintomas_generales" label="Síntomas generales" />
            </div>
          </Section>

          <Section id="exploracion_fisica" title="Exploración Física">
            <SignosVitalesFields prefix="exploracion_fisica.signos_vitales" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <TextInput name="exploracion_fisica.habitus_exterior" label="Habitus exterior" />
              <TextInput name="exploracion_fisica.neurologico" label="Neurológico" />
              <TextInput name="exploracion_fisica.cabeza" label="Cabeza" />
              <TextInput name="exploracion_fisica.cara" label="Cara" />
              <TextInput name="exploracion_fisica.ojos" label="Ojos" />
              <TextInput name="exploracion_fisica.oido" label="Oído" />
              <TextInput name="exploracion_fisica.nariz" label="Nariz" />
              <TextInput name="exploracion_fisica.cavidad_bucal" label="Cavidad bucal" />
              <TextInput name="exploracion_fisica.cuello" label="Cuello" />
              <TextInput name="exploracion_fisica.torax" label="Tórax" />
              <TextInput name="exploracion_fisica.region_precordial" label="Región precordial" />
              <TextInput name="exploracion_fisica.abdomen" label="Abdomen" />
              <TextInput name="exploracion_fisica.genitales_externos" label="Genitales externos" />
              <TextInput name="exploracion_fisica.extremidades" label="Extremidades" />
            </div>
          </Section>

          <Section id="examenes_previos" title="Exámenes Previos">
            <TextArea name="examenes_previos" label="Descripción de exámenes previos" rows={3} />
          </Section>

          <Section id="diagnosticos" title="Diagnósticos">
            <TextArea name="diagnosticos" label="Diagnósticos clínicos" rows={3} />
          </Section>

          <Section id="plan_y_tratamiento" title="Plan y Tratamiento">
            <TextArea name="plan_y_tratamiento" label="Plan de manejo y tratamiento" rows={4} />
          </Section>

          {/* Componente Reutilizable de Imágenes */}
          <ImageAttachmentUploader images={images} onChange={setImages} />

          {/* Botón Guardar */}
          <div className="sticky bottom-4 mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
            >
              <Save className="w-5 h-5" />
              Guardar Historia Clínica
            </button>
          </div>
        </form>
      </FormProvider>

      {/* Componente Reutilizable de Confirmación */}
      <ConfirmSaveModal
        isOpen={showConfirm}
        isSaving={isSaving}
        errorMessage={saveError}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
