'use client'
// components/StaleDataBanner.tsx
// Banner permanente (no descartable) cuando hay documentos pendientes de sync
// con más de 3 días de antigüedad.

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { db } from '@/lib/db/localDb'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export default function StaleDataBanner() {
  const [hasStale, setHasStale] = useState(false)

  useEffect(() => {
    async function check() {
      const cutoff = new Date(Date.now() - THREE_DAYS_MS).toISOString()
      const stale = await db.pending_documents
        .where('created_at_local')
        .below(cutoff)
        .and((doc) => doc.sync_status === 'pending' || doc.sync_status === 'error')
        .count()
      setHasStale(stale > 0)
    }

    check()
    // Re-chequea cada 5 minutos mientras la app está abierta
    const id = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  if (!hasStale) return null

  return (
    <div
      role="alert"
      className="
        w-full bg-amber-500/10 border-b border-amber-500/30
        px-4 py-3
      "
    >
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 text-sm font-semibold leading-tight">
            Tienes documentos sin sincronizar desde hace varios días
          </p>
          <p className="text-amber-400/80 text-xs mt-0.5">
            Conéctate a internet pronto para no arriesgar esa información.
            Los documentos se subirán automáticamente al recuperar la conexión.
          </p>
        </div>
      </div>
    </div>
  )
}
