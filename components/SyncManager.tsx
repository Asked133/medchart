'use client'
// components/SyncManager.tsx
// Componente invisible que registra los listeners de sincronización.
// Se monta una sola vez en el layout protegido.
// NO usa Background Sync API — compatible con iOS Safari.

import { useEffect } from 'react'
import { syncPendingData } from '@/lib/sync/syncEngine'

export default function SyncManager() {
  useEffect(() => {
    // Al montar: intenta sincronizar si hay conexión
    if (navigator.onLine) {
      syncPendingData()
    }

    // Al recuperar conexión
    function handleOnline() {
      console.log('[SyncManager] Conexión recuperada → sincronizando…')
      syncPendingData()
    }

    // Al volver la app al primer plano (visibilitychange)
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.log('[SyncManager] App en primer plano → sincronizando…')
        syncPendingData()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Sin render — solo efectos
  return null
}
