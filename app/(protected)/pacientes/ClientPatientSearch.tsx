'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { db, type CachedPatient, type PendingPatient } from '@/lib/db/localDb'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import Link from 'next/link'
import { Search, Plus, User, AlertCircle, WifiOff } from 'lucide-react'

// Necesitamos definir el cliente de supabase aquí para usar el RPC.
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function ClientPatientSearch({ doctorId }: { doctorId: string }) {
  const isOnline = useOnlineStatus()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<(CachedPatient | PendingPatient)[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Estado para el modal de nuevo paciente
  const [showNewModal, setShowNewModal] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Si la búsqueda está vacía, mostramos vacio
    if (!query.trim()) {
      setResults([])
      return
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current)

    debounceTimeout.current = setTimeout(() => {
      performSearch(query.trim())
    }, 300)

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current)
    }
  }, [query, isOnline])

  async function performSearch(searchTerm: string) {
    setIsSearching(true)
    setErrorMsg('')
    
    let searchedOnline = false
    let onlineResults: (CachedPatient | PendingPatient)[] = []

    if (isOnline) {
      try {
        const supabase = getSupabase()
        // Intentar consulta con timeout manual para resiliencia
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        // Usamos el RPC para ignorar acentos y mayúsculas
        const { data, error } = await supabase.rpc('search_patients', {
          search_query: searchTerm,
        }).abortSignal(controller.signal)
        
        clearTimeout(timeoutId)

        if (error) throw error
        
        searchedOnline = true
        onlineResults = data || []
        
        // Cachear resultados encontrados
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
        searchedOnline = false // Forzar fallback
      }
    }

    if (!searchedOnline) {
      // Búsqueda offline en Dexie (cached + pending)
      const termLower = searchTerm.toLowerCase()
      
      // Función simple para quitar acentos básicos en JS para la búsqueda local
      const removeAccents = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      
      const termNoAccents = removeAccents(termLower)

      const filterFn = (p: CachedPatient | PendingPatient) => {
        if (p.doctor_id !== doctorId) return false
        const nameNoAccents = removeAccents(p.full_name.toLowerCase())
        return nameNoAccents.includes(termNoAccents)
      }

      const cached = await db.cached_patients.filter(filterFn).toArray()
      const pending = await db.pending_patients.filter(filterFn).toArray()

      // Juntar y deduplicar por id
      const combined = [...pending, ...cached]
      const unique = Array.from(new Map(combined.map(p => [p.id, p])).values())
      
      // Ordenar alfabéticamente
      unique.sort((a, b) => a.full_name.localeCompare(b.full_name))
      
      onlineResults = unique
    } else {
      // Aún si fue online, necesitamos incluir los pending_patients locales 
      // que no han subido a Supabase pero que coinciden con la búsqueda.
      const termLower = searchTerm.toLowerCase()
      const removeAccents = (str: string) => 
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const termNoAccents = removeAccents(termLower)

      const pending = await db.pending_patients.filter((p) => {
        if (p.doctor_id !== doctorId) return false
        const nameNoAccents = removeAccents(p.full_name.toLowerCase())
        return nameNoAccents.includes(termNoAccents)
      }).toArray()

      // Evitar duplicados si por alguna rareza ya está en ambos lados
      const existingIds = new Set(onlineResults.map(p => p.id))
      const pendingToAdd = pending.filter(p => !existingIds.has(p.id))
      
      onlineResults = [...pendingToAdd, ...onlineResults]
      // Ordenar
      onlineResults.sort((a, b) => a.full_name.localeCompare(b.full_name))
    }

    setResults(onlineResults)
    setIsSearching(false)
  }

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault()
    const name = newPatientName.trim()
    if (!name) return

    setIsCreating(true)
    setErrorMsg('')
    
    // Generar ID local siempre (crypto.randomUUID() soportado en navegadores modernos)
    const newId = crypto.randomUUID()
    const now = new Date().toISOString()
    
    // Objeto genérico para enviar a Supabase
    const newPatientData = {
      id: newId,
      doctor_id: doctorId,
      full_name: name,
      created_at: now
    }

    let createdOnline = false

    if (isOnline) {
      try {
        const supabase = getSupabase()
        const { error } = await supabase.from('patients').insert(newPatientData)
        if (error) throw error
        
        // Guardar en caché si tuvo éxito
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
      // Guardar como pendiente si estamos offline o falló la inserción
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
    
    // Disparar búsqueda de nuevo si hay query, o mostrar el nuevo si no
    if (query) {
      performSearch(query)
    } else {
      setResults([{
        id: newId,
        doctor_id: doctorId,
        full_name: name,
        created_at: now,
        cached_at: now
      } as CachedPatient])
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paciente por nombre..."
          className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {query.trim().length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {results.length > 0 ? (
            <ul className="divide-y divide-slate-800/50">
              {results.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/pacientes/${patient.id}`}
                    className="flex items-center px-4 py-4 hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {patient.full_name}
                      </p>
                      {/* Check if it's pending by looking it up in dexie? Actually we can't tell easily unless we add a flag, but this is fine. */}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            !isSearching && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-slate-400 mb-4">No se encontraron pacientes con "{query}"</p>
                <button
                  onClick={() => {
                    setNewPatientName(query)
                    setShowNewModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar como nuevo paciente
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Modal de Nuevo Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="text-lg font-medium text-white">Nuevo Paciente</h3>
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
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                  autoFocus
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
