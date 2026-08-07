'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase/browser'
import { db, type CachedPatient, type PendingPatient } from '@/lib/db/localDb'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import Link from 'next/link'
import { Search, Plus, User, AlertCircle, WifiOff } from 'lucide-react'

export default function ClientPatientSearch({ doctorId }: { doctorId: string }) {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<(CachedPatient | PendingPatient)[]>([])
  const [isSearching, setIsSearching] = useState(true) // Inicia en true para indicar carga inicial
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  
  // Estado para el modal de nuevo paciente
  const [showNewModal, setShowNewModal] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // 1. Carga instantánea local de Dexie al montar (0ms latencia percibida)
  useEffect(() => {
    async function loadLocalFast() {
      try {
        const cached = await db.cached_patients.filter(p => p.doctor_id === doctorId).toArray()
        const pending = await db.pending_patients.filter(p => p.doctor_id === doctorId).toArray()
        const combined = [...pending, ...cached]
        const unique = Array.from(new Map(combined.map(p => [p.id, p])).values())
        unique.sort((a, b) => a.full_name.localeCompare(b.full_name))
        
        if (unique.length > 0) {
          setResults(unique)
          setHasLoadedOnce(true)
        }
      } catch (err) {
        console.warn('Error en pre-carga local:', err)
      }
    }
    loadLocalFast()
  }, [doctorId])

  // 2. Búsqueda con debounce para consultas largas o instantánea para búsqueda vacía
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)

    const delay = query.trim() ? 300 : 0
    debounceTimeout.current = setTimeout(() => {
      performSearch(query.trim())
    }, delay)

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [query, isOnline, doctorId])

  async function performSearch(searchTerm: string) {
    setIsSearching(true)
    setErrorMsg('')
    
    let searchedOnline = false
    let onlineResults: (CachedPatient | PendingPatient)[] = []

    if (isOnline) {
      try {
        const supabase = getBrowserSupabase()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        let resData: any = null
        let resError: any = null

        if (searchTerm) {
          const { data, error } = await supabase.rpc('search_patients', {
            search_query: searchTerm,
          }).abortSignal(controller.signal)
          resData = data
          resError = error
        } else {
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('full_name', { ascending: true })
            .abortSignal(controller.signal)
          resData = data
          resError = error
        }

        clearTimeout(timeoutId)

        if (resError) throw resError
        
        searchedOnline = true
        onlineResults = resData || []
        
        if (onlineResults.length > 0) {
          const toCache: CachedPatient[] = onlineResults.map(r => ({
            id: r.id,
            doctor_id: r.doctor_id,
            full_name: r.full_name,
            date_of_birth: r.date_of_birth,
            created_at: ('created_at' in r ? r.created_at : (r as PendingPatient).created_at_local) || new Date().toISOString(),
            cached_at: new Date().toISOString()
          }))
          await db.cached_patients.bulkPut(toCache)
        }
      } catch (err: any) {
        console.warn('[search] Búsqueda online falló, cayendo a búsqueda local:', err.message)
        searchedOnline = false
      }
    }

    if (!searchedOnline) {
      const termLower = searchTerm.toLowerCase()
      const removeAccents = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      
      const termNoAccents = removeAccents(termLower)

      const filterFn = (p: CachedPatient | PendingPatient) => {
        if (p.doctor_id !== doctorId) return false
        if (!termNoAccents) return true
        const nameNoAccents = removeAccents(p.full_name.toLowerCase())
        return nameNoAccents.includes(termNoAccents)
      }

      const cached = await db.cached_patients.filter(filterFn).toArray()
      const pending = await db.pending_patients.filter(filterFn).toArray()

      const combined = [...pending, ...cached]
      const unique = Array.from(new Map(combined.map(p => [p.id, p])).values())
      unique.sort((a, b) => a.full_name.localeCompare(b.full_name))
      
      onlineResults = unique
    } else {
      const termLower = searchTerm.toLowerCase()
      const removeAccents = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const termNoAccents = removeAccents(termLower)

      const pending = await db.pending_patients.filter((p) => {
        if (p.doctor_id !== doctorId) return false
        if (!termNoAccents) return true
        const nameNoAccents = removeAccents(p.full_name.toLowerCase())
        return nameNoAccents.includes(termNoAccents)
      }).toArray()

      const existingIds = new Set(onlineResults.map(p => p.id))
      const pendingToAdd = pending.filter(p => !existingIds.has(p.id))
      
      onlineResults = [...pendingToAdd, ...onlineResults]
      onlineResults.sort((a, b) => a.full_name.localeCompare(b.full_name))
    }

    setResults(onlineResults)
    setIsSearching(false)
    setHasLoadedOnce(true)
  }

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault()
    const name = newPatientName.trim()
    if (!name) return

    setIsCreating(true)
    setErrorMsg('')
    
    const newId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    const newPatientData = {
      id: newId,
      doctor_id: doctorId,
      full_name: name,
      created_at: now
    }

    let createdOnline = false

    if (isOnline) {
      try {
        const supabase = getBrowserSupabase()
        const { error } = await supabase.from('patients').insert(newPatientData)
        if (error) throw error
        
        const cachedPatient: CachedPatient = {
          ...newPatientData,
          cached_at: now
        }
        await db.cached_patients.put(cachedPatient)
        createdOnline = true
      } catch (err: any) {
        console.warn('[search] Error creando paciente online, guardando offline:', err.message)
      }
    }

    if (!createdOnline) {
      await db.pending_patients.put({
        id: newId,
        doctor_id: doctorId,
        full_name: name,
        sync_status: 'pending',
        created_at_local: now
      })
    }

    setIsCreating(false)
    setShowNewModal(false)
    setNewPatientName('')

    router.push(`/pacientes/${newId}`)
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y botón de nuevo paciente */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paciente por nombre..."
            className="block w-full pl-10 pr-3 py-3 border border-border-strong rounded-xl leading-5 bg-surface text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm transition-colors shadow-clinical-sm"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-text"></div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setNewPatientName(query.trim())
            setShowNewModal(true)
          }}
          className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-clinical-sm text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand focus:ring-offset-background transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </button>
      </div>

      {/* Resultados y lista general */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-clinical-sm">
        {results.length > 0 ? (
          <ul className="divide-y divide-border-subtle">
            {results.map((patient) => (
              <li key={patient.id}>
                <Link
                  href={`/pacientes/${patient.id}`}
                  className="flex items-center px-4 py-4 hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 rounded-full bg-brand-muted flex items-center justify-center border border-brand/20 group-hover:bg-brand/20 transition-colors">
                      <User className="w-5 h-5 text-brand-text" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-brand-text transition-colors">
                      {patient.full_name}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (isSearching || !hasLoadedOnce) ? (
          /* Estado de Carga Elegante (Skeleton) — Evita sustos de "No hay pacientes" */
          <div className="p-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-hover shrink-0" />
              <div className="h-4 bg-surface-hover rounded w-1/3" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-hover shrink-0" />
              <div className="h-4 bg-surface-hover rounded w-1/4" />
            </div>
          </div>
        ) : (
          /* Confirmado Sin Pacientes tras finalizar carga */
          <div className="px-4 py-12 text-center">
            {query.trim().length > 0 ? (
              <>
                <p className="text-sm text-foreground-muted mb-4">No se encontraron pacientes con "{query}"</p>
                <button
                  onClick={() => {
                    setNewPatientName(query)
                    setShowNewModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-clinical-sm text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand focus:ring-offset-background transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar "{query}" como nuevo paciente
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <User className="w-12 h-12 text-foreground-muted mb-3 opacity-50" />
                <p className="text-sm text-foreground-muted mb-4">Aún no tienes pacientes registrados.</p>
                <button
                  onClick={() => {
                    setNewPatientName('')
                    setShowNewModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-clinical-sm text-white bg-brand hover:bg-brand-hover transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar tu primer paciente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Nuevo Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border-strong rounded-2xl w-full max-w-md overflow-hidden shadow-clinical">
            <div className="px-6 py-5 border-b border-border-subtle">
              <h3 className="text-lg font-medium text-foreground tracking-tight">Nuevo Paciente</h3>
            </div>
            
            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{errorMsg}</p>
                </div>
              )}
              
              {!isOnline && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                  <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">
                    Estás trabajando sin conexión. El paciente se guardará localmente y se sincronizará cuando vuelvas a tener internet.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground-muted mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="block w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm"
                  required
                  autoFocus
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 border border-border-strong text-foreground-muted rounded-lg hover:bg-surface-hover hover:text-foreground transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-clinical-sm"
                >
                  {isCreating ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
