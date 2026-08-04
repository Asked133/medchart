'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { db, type CachedPatient, type PendingPatient, type CachedDocument } from '@/lib/db/localDb'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { ArrowLeft, Clock, FileText, Image as ImageIcon, CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const LABELS: Record<string, string> = {
  // Common
  padecimiento_actual: 'Padecimiento Actual',
  exploracion_fisica: 'Exploración Física',
  signos_vitales: 'Signos Vitales y Somatometría',
  plan_y_tratamiento: 'Plan y Tratamiento',
  estudios: 'Estudios',
  
  // Signos vitales
  talla: 'Talla',
  peso: 'Peso',
  imc: 'IMC',
  fc: 'FC',
  temperatura: 'Temperatura',
  fr: 'FR',
  tension_arterial: 'Tensión arterial',
  saturacion: 'Saturación',

  // Historia Clínica specific
  ficha_identificacion: 'Ficha de Identificación',
  nombre_completo: 'Nombre completo',
  fecha_nacimiento: 'Fecha de nacimiento',
  genero: 'Género',
  edad: 'Edad',
  estado_civil: 'Estado civil',
  nacionalidad: 'Nacionalidad',
  lugar_nacimiento: 'Lugar de nacimiento',
  direccion: 'Dirección',
  escolaridad: 'Escolaridad',
  ocupacion: 'Ocupación',
  persona_responsable: 'Persona responsable',
  
  antecedentes_heredo_familiares: 'Antecedentes Heredo-Familiares',
  antecedentes_personales_no_patologicos: 'Antecedentes Personales No Patológicos',
  alimentacion: 'Alimentación',
  vivienda: 'Vivienda',
  habitos_higienicos_individuales: 'Hábitos higiénicos',
  tiempo_libre: 'Tiempo libre',
  inmunizaciones: 'Inmunizaciones',
  
  antecedentes_personales_patologicos: 'Antecedentes Personales Patológicos',
  infectocontagiosos: 'Infectocontagiosos',
  enfermedades_exantematicas: 'Enfermedades exantemáticas',
  enfermedades_cronico_degenerativas: 'Enfermedades crónico degenerativas',
  alergias: 'Alergias',
  quirurgicos: 'Quirúrgicos',
  traumaticos: 'Traumáticos',
  convulsivos: 'Convulsivos',
  transfusiones: 'Transfusiones',
  drogas: 'Drogas',
  hospitalizaciones_previas: 'Hospitalizaciones previas',
  exposicion_a_biomasa: 'Exposición a biomasa',
  factores_de_riesgo_cardiovascular: 'Factores de riesgo cardiovascular',
  
  interrogatorio_aparatos_sistemas: 'Interrogatorio por Aparatos y Sistemas',
  aparato_respiratorio: 'Aparato respiratorio',
  aparato_cardiovascular: 'Aparato cardiovascular',
  aparato_digestivo: 'Aparato digestivo',
  aparato_renal_urinario: 'Aparato renal y urinario',
  aparato_genital: 'Aparato genital',
  endocrino: 'Endocrino',
  hematologico: 'Hematológico',
  piel_y_anexos: 'Piel y anexos',
  musculo_esqueletico: 'Músculo esquelético',
  sistema_nervioso_central: 'Sistema nervioso central',
  organo_de_los_sentidos: 'Órgano de los sentidos',
  esfera_psiquica: 'Esfera psíquica',
  sintomas_generales: 'Síntomas generales',
  
  habitus_exterior: 'Habitus exterior',
  neurologico: 'Neurológico',
  cabeza: 'Cabeza',
  cara: 'Cara',
  ojos: 'Ojos',
  oido: 'Oído',
  nariz: 'Nariz',
  cavidad_bucal: 'Cavidad bucal',
  cuello: 'Cuello',
  torax: 'Tórax',
  region_precordial: 'Región precordial',
  abdomen: 'Abdomen',
  genitales_externos: 'Genitales externos',
  extremidades: 'Extremidades',
  
  examenes_previos: 'Exámenes Previos',
  diagnosticos: 'Diagnósticos',
}

type AttachmentView = {
  id: string
  url: string
}

export default function DocumentView({
  patientId,
  docId,
  initialPatient,
  initialDocument,
  initialAttachments
}: {
  patientId: string
  docId: string
  initialPatient: any
  initialDocument: any
  initialAttachments: any[]
}) {
  const isOnline = useOnlineStatus()
  
  const [patient, setPatient] = useState<CachedPatient | PendingPatient | null>(initialPatient)
  const [document, setDocument] = useState<any>(initialDocument)
  const [images, setImages] = useState<AttachmentView[]>([])
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPendingSync, setIsPendingSync] = useState(false)

  useEffect(() => {
    async function loadData() {
      // 1. Cargar Paciente si falta
      if (!patient) {
        const pat = await db.pending_patients.get(patientId) || await db.cached_patients.get(patientId)
        if (pat) setPatient(pat)
      }

      // 2. Orden de búsqueda estricto para el Documento:
      //    1. clinical_documents de Supabase (initialDocument)
      //    2. cached_documents (IndexedDB)
      //    3. pending_documents (IndexedDB)
      let currentDoc = initialDocument

      if (currentDoc) {
        // Cachear en local si viene de Supabase para futuras consultas offline
        const cachedToSave: CachedDocument = {
          id: currentDoc.id,
          patient_id: currentDoc.patient_id,
          doctor_id: currentDoc.doctor_id,
          document_type: currentDoc.document_type,
          document_date: currentDoc.document_date,
          content: currentDoc.content,
          created_at: currentDoc.created_at || currentDoc.document_date || new Date().toISOString(),
          cached_at: new Date().toISOString()
        }
        await db.cached_documents.put(cachedToSave)
      } else {
        // Intentar primero cached_documents
        const cachedDoc = await db.cached_documents.get(docId)
        if (cachedDoc) {
          currentDoc = cachedDoc
        } else {
          // Por último, pending_documents
          const pendingDoc = await db.pending_documents.get(docId)
          if (pendingDoc) {
            currentDoc = pendingDoc
            setIsPendingSync(true)
          }
        }
        setDocument(currentDoc)
      }

      // 3. Cargar Imágenes
      if (currentDoc) {
        let loadedImages: AttachmentView[] = []
        
        // Revisar primero si hay adjuntos pendientes locales
        const pendingAtts = await db.pending_attachments.where('document_id').equals(docId).toArray()
        if (pendingAtts.length > 0) {
          loadedImages = pendingAtts.map(a => ({
            id: a.id,
            url: URL.createObjectURL(a.file_blob)
          }))
        } else if (initialAttachments && initialAttachments.length > 0 && isOnline) {
          // Obtener URLs firmadas de Supabase Storage
          const supabase = getSupabase()
          const urls = await Promise.all(initialAttachments.map(async (att) => {
            const { data } = await supabase.storage.from('clinical-attachments').createSignedUrl(att.storage_path, 3600)
            return {
              id: att.id,
              url: data?.signedUrl || ''
            }
          }))
          loadedImages = urls.filter(u => u.url !== '')
        }
        setImages(loadedImages)
      }

      setIsLoading(false)
    }
    
    loadData()
  }, [patientId, docId, initialPatient, initialDocument, initialAttachments, isOnline])

  // Limpieza de Object URLs de blob local al desmontar o cambiar imágenes
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })
    }
  }, [images])

  if (isLoading) return <div className="text-center py-12 text-slate-400">Cargando documento...</div>
  if (!document) return <div className="text-center py-12 text-slate-400">No se encontró el documento.</div>

  const content = document.content || {}
  const isNotaEvolucion = document.document_type === 'nota_evolucion'

  // Helper para renderizar un campo de texto simple (omite vacíos)
  const renderTextBlock = (key: string, title: string, text?: string) => {
    if (!text || !text.trim()) return null
    return (
      <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3 border-b border-slate-800 pb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{text}</p>
      </div>
    )
  }

  // Helper para renderizar un grupo de campos (omite campos individuales vacíos)
  const renderFieldsGroup = (key: string, title: string, fieldsObj?: Record<string, any>) => {
    if (!fieldsObj || typeof fieldsObj !== 'object') return null
    const entries = Object.entries(fieldsObj).filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
    if (entries.length === 0) return null

    return (
      <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-4 border-b border-slate-800 pb-2">
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(([fKey, val]) => (
            <div key={fKey}>
              <div className="text-xs font-medium text-slate-400 mb-1">{LABELS[fKey] || fKey}</div>
              <div className="text-sm text-slate-200 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-800">
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Helper específico para Signos Vitales
  const renderSignosVitalesBlock = (vitalsObj?: Record<string, any>) => {
    if (!vitalsObj || typeof vitalsObj !== 'object') return null
    const entries = Object.entries(vitalsObj).filter(([_, v]) => typeof v === 'string' && v.trim() !== '')
    if (entries.length === 0) return null

    return (
      <div key="signos_vitales" className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-4 border-b border-slate-800 pb-2">
          Signos Vitales y Somatometría
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {entries.map(([vKey, val]) => (
            <div key={vKey}>
              <div className="text-xs font-medium text-slate-400 mb-1">{LABELS[vKey] || vKey}</div>
              <div className="text-sm text-slate-200 bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-800">
                {val}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── RENDERIZADO EXPLÍCITO NOTA DE EVOLUCIÓN ──────────────────────────────
  const renderNotaEvolucionContent = () => (
    <>
      {renderTextBlock('padecimiento_actual', 'Padecimiento Actual', content.padecimiento_actual)}
      {renderTextBlock('exploracion_fisica', 'Exploración Física', content.exploracion_fisica)}
      {renderSignosVitalesBlock(content.signos_vitales)}
      {renderTextBlock('plan_y_tratamiento', 'Plan y Tratamiento', content.plan_y_tratamiento)}
      {renderTextBlock('estudios', 'Estudios', content.estudios)}
    </>
  )

  // ─── RENDERIZADO EXPLÍCITO HISTORIA CLÍNICA ────────────────────────────────
  const renderHistoriaClinicaContent = () => {
    const expFisica = content.exploracion_fisica || {}
    const { signos_vitales, ...restoExpFisica } = expFisica

    return (
      <>
        {renderFieldsGroup('ficha_identificacion', 'Ficha de Identificación', content.ficha_identificacion)}
        {renderTextBlock('antecedentes_heredo_familiares', 'Antecedentes Heredo-Familiares', content.antecedentes_heredo_familiares)}
        {renderFieldsGroup('antecedentes_personales_no_patologicos', 'Antecedentes Personales No Patológicos', content.antecedentes_personales_no_patologicos)}
        {renderFieldsGroup('antecedentes_personales_patologicos', 'Antecedentes Personales Patológicos', content.antecedentes_personales_patologicos)}
        {renderTextBlock('padecimiento_actual', 'Padecimiento Actual', content.padecimiento_actual)}
        {renderFieldsGroup('interrogatorio_aparatos_sistemas', 'Interrogatorio por Aparatos y Sistemas', content.interrogatorio_aparatos_sistemas)}
        
        {(signos_vitales || Object.keys(restoExpFisica).length > 0) && (
          <div className="space-y-4 mb-4">
            {renderSignosVitalesBlock(signos_vitales)}
            {renderFieldsGroup('resto_exploracion_fisica', 'Exploración Física Regional', restoExpFisica)}
          </div>
        )}

        {renderTextBlock('examenes_previos', 'Exámenes Previos', content.examenes_previos)}
        {renderTextBlock('diagnosticos', 'Diagnósticos', content.diagnosticos)}
        {renderTextBlock('plan_y_tratamiento', 'Plan y Tratamiento', content.plan_y_tratamiento)}
      </>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Botón único permitido: Volver al paciente */}
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/pacientes/${patientId}`} className="text-blue-400 hover:text-blue-300 flex items-center text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al paciente
        </Link>
        
        {isPendingSync ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Pendiente de sincronizar</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Guardado</span>
          </div>
        )}
      </div>

      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isNotaEvolucion ? 'Nota de Evolución' : 'Historia Clínica'}
            </h1>
            <p className="text-slate-400 text-sm">
              {new Date(document.document_date).toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        {patient && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">PACIENTE</p>
              <p className="text-slate-200 font-medium">{patient.full_name}</p>
            </div>
            {patient.date_of_birth && (
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">FECHA DE NACIMIENTO</p>
                <p className="text-slate-200">{patient.date_of_birth}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Renderizado Explícito según Tipo de Documento */}
      {isNotaEvolucion ? renderNotaEvolucionContent() : renderHistoriaClinicaContent()}

      {/* Sección de Imágenes Adjuntas en cuadrícula con visor modal (lightbox) */}
      {images.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-6">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Imágenes adjuntas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map(img => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageModal(img.url)}
                className="block text-left relative aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img src={img.url} alt="Adjunto" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium bg-slate-900/80 px-2 py-1 rounded">Ampliar</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox / Visor de Imagen Ampliada */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 z-10 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white p-2 rounded-full border border-slate-700 transition-colors"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeImageModal}
              alt="Imagen ampliada"
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
