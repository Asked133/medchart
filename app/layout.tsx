// app/layout.tsx — Layout raíz (Server Component)
// Aplica a TODAS las rutas. Solo contiene lo mínimo: fuentes, meta PWA, CSS global.

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s — MedChart',
    default: 'MedChart — Sistema de Historias Clínicas',
  },
  description: 'Sistema de historias clínicas para médicos. Seguro, offline-first y conforme a NOM-004.',
  robots: 'noindex, nofollow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MedChart',
  },
  icons: {
    apple: '/icons/icon-apple-180x180.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  // Deshabilita el zoom automático en inputs para iPad (mejor UX táctil)
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-MX" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground font-sans antialiased">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
