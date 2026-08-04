// app/manifest.ts
// Manifest PWA — Next.js App Router lo sirve en /manifest.webmanifest automáticamente.
// display: 'standalone' → abre sin barra de Safari al agregar a pantalla de inicio.

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MedChart — Historias Clínicas',
    short_name: 'MedChart',
    description: 'Sistema de historias clínicas para médicos',
    start_url: '/pacientes',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a', // slate-900
    theme_color: '#0f172a',
    lang: 'es-MX',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-apple-180x180.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
