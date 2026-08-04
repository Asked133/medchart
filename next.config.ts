// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el modo estricto de React para detectar side effects en dev
  reactStrictMode: true,

  // Cabeceras de seguridad
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // El service worker no debe cachearse por el browser entre versiones
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig
