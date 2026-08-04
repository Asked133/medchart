'use client'
// components/ServiceWorkerRegistrar.tsx
// Registra el service worker solo en el cliente, después del primer render.
// Separado del layout para que no bloquee el SSR.

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          console.log('[SW] Registrado:', reg.scope)
        })
        .catch((err) => {
          console.error('[SW] Error al registrar:', err)
        })
    }
  }, [])

  return null
}
