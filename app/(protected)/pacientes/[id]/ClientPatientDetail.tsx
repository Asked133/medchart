'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { db, type CachedPatient, type PendingPatient, type CachedDocument, type PendingDocument } from '@/lib/db/localDb'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import Link from 'next/link'
import { FileText, Plus, AlertCircle, Clock, ChevronRight, FileHeart } from 'lucide-react'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Interfaz unificada para la vista
type UnifiedDocument = {
  id: string
  type: string
  date: string
  sync_status: 'synced' | 'pending' | 'syncing' | 'error'
  isPending: boolean
}

export default function ClientPatientDetail({
  patientId,
  initialPatient,
  doctorId,
}: {
  patientId: string
  initialPatient: CachedPatient | PendingPatient | null
  doctorId: string
}) {
  const isOnline = useOnlineStatus()
  const [patient, setPatient] = useState<CachedPatient | PendingPatient | null>(initialPatient)
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPatientData()
  }, [patientId, isOnline])

  async function loadPatientData() {
    setIsLoading(true)
    
    // 1. Cargar Paciente si no lo tenemos (puede ser un alta offline)
    if (!patient) {
      const pendingPat = await db.pending_patients.get(patientId)
      if (pendingPat) {
        setPatient(pendingPat)
      } else {
        const cachedPat = await db.cached_patients.get(patientId)
        if (cachedPat) setPatient(cachedPat)
      }
    }

    // 2. Cargar Documentos
    let remoteDocs: CachedDocument[] = []
    let searchedOnline = false

    if (isOnline) {
      try {
        const supabase = getSupabase()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const { data, error } = await supabase
          .from('clinical_documents')
          .select('*')
          .eq('patient_id', patientId)
          .order('document_date', { ascending: false })
          .abortSignal(controller.signal)
        
        clearTimeout(timeoutId)

        if (error) throw error
        remoteDocs = data || []
        
        // Cachear
        if (remoteDocs.length > 0) {
          const toCache: CachedDocument[] = remoteDocs.map((r: any) => ({
            ...r,
            cached_at: new Date().toISOString()
          }))
          await db.cached_documents.bulkPut(toCache)
        }
        searchedOnline = true
      } catch (err) {
        console.warn('[detail] Error cargando docs online, fallback a cache', err)
      }
    }

    if (!searchedOnline) {
      remoteDocs = await db.cached_documents
        .where('patient_id')
        .equals(patientId)
        .toArray()
    }

    // 3. Cargar Documentos Pendientes locales
    const pendingDocs = await db.pending_documents
      .where('patient_id')
      .equals(patientId)
      .toArray()

    // 4. Unificar y deduplicar (si un pending acaba de sincronizarse y ya viene de remoteDocs)
    const remoteIds = new Set(remoteDocs.map(d => d.id))
    const validPendingDocs = pendingDocs.filter(d => !remoteIds.has(d.id))

    const unified: UnifiedDocument[] = [
      ...remoteDocs.map(d => ({
        id: d.id,
        type: d.document_type,
        date: d.document_date,
        sync_status: 'synced' as const,
        isPending: false
      })),
      ...validPendingDocs.map(d => ({
        id: d.id,
        type: d.document_type,
        date: d.document_date,
        sync_status: d.sync_status,
        isPending: true
      }))
    ]

    // 5. Ordenar estrictamente por fecha descendente
    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setDocuments(unified)
    setIsLoading(false)
  }

  if (!patient && !isLoading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-4" />
        <h3 className="text-lg font-medium text-slate-200">Paciente no encontrado</h3>
        <p className="text-slate-400 mt-2">No pudimos cargar la información de este paciente.</p>
        <Link href="/pacientes" className="mt-6 inline-block text-blue-400 hover:text-blue-300">
          Volver a búsqueda
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabecera del Paciente */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {patient?.full_name || 'Cargando...'}
          </h1>
          {patient && (
            <p className="text-slate-400 text-sm mt-1">
              ID: <span className="font-mono text-xs">{patient.id}</span>
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="flex gap-3 sm:flex-row flex-col">
        <Link
          href={`/pacientes/${patientId}/nueva-historia`}
          className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-300 rounded-xl p-4 flex items-center gap-3 transition-colors group"
        >
          <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition-colors">
            <FileHeart className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-medium">Historia Clínica</div>
            <div className="text-xs text-blue-400/70">Registrar historial completo</div>
          </div>
        </Link>
        <Link
          href={`/pacientes/${patientId}/nueva-nota`}
          className="flex-1 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-300 rounded-xl p-4 flex items-center gap-3 transition-colors group"
        >
          <div className="bg-violet-500/20 p-2 rounded-lg group-hover:bg-violet-500/30 transition-colors">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <div className="font-medium">Nota de Evolución</div>
            <div className="text-xs text-violet-400/70">Capturar seguimiento</div>
          </div>
        </Link>
      </div>

      {/* Lista de Documentos */}
      <div>
        <h2 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          Historial de Documentos
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : documents.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/50">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/pacientes/${patientId}/documentos/${doc.id}`}
                className="block hover:bg-slate-800/50 transition-colors p-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      doc.type === 'historia_clinica' 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-violet-500/10 text-violet-400'
                    }`}>
                      {doc.type === 'historia_clinica' ? <FileHeart className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">
                          {doc.type === 'historia_clinica' ? 'Historia Clínica' : 'Nota de Evolución'}
                        </span>
                        {doc.isPending && doc.sync_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                        {doc.isPending && doc.sync_status === 'error' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Error al sincronizar
                          </span>
                        )}
                        {doc.isPending && doc.sync_status === 'syncing' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                            Sincronizando...
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {new Date(doc.date).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600 mb-3" />
            <p className="text-slate-400">El paciente no tiene documentos clínicos registrados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
