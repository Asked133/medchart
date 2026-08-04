// lib/hooks/useOnlineStatus.ts
// Hook reactivo que sigue el estado de conexión del navegador.
// Compatible con SSR (inicia en true para evitar hydration mismatch).

'use client'

import { useEffect, useState } from 'react'

export function useOnlineStatus(): boolean {
  // Empieza en true: en SSR navigator no existe. Se corrige en el primer effect.
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Sincroniza el estado real al montar en el cliente
    setIsOnline(navigator.onLine)

    function handleOnline() { setIsOnline(true) }
    function handleOffline() { setIsOnline(false) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
