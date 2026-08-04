// public/sw.js
// Service Worker con Workbox (versión inline — sin necesidad de build step extra).
// Estrategia: NetworkFirst para API, CacheFirst para assets estáticos.
// No incluye push notifications — la app es 100% online cuando conectada.

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js')

const { registerRoute } = workbox.routing
const { NetworkFirst, CacheFirst, StaleWhileRevalidate } = workbox.strategies
const { CacheableResponsePlugin } = workbox.cacheableResponse
const { ExpirationPlugin } = workbox.expiration
const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching

// Limpia cachés de versiones anteriores del SW
cleanupOutdatedCaches()

// ── Assets estáticos (_next/static) ─────────────────────────────────────────
// CacheFirst: JS, CSS y fuentes rara vez cambian entre versiones.
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/static/'),
  new CacheFirst({
    cacheName: 'next-static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 días
    ],
  })
)

// ── Imágenes (_next/image) ───────────────────────────────────────────────────
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/image'),
  new StaleWhileRevalidate({
    cacheName: 'next-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
)

// ── Rutas de la app (HTML) ───────────────────────────────────────────────────
// NetworkFirst: siempre intenta obtener la versión más reciente.
// Si no hay red, sirve el HTML cacheado (app shell offline).
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// ── API de Supabase — NO cachear ─────────────────────────────────────────────
// Las llamadas a la API siempre deben ir a la red.
// Si no hay conexión, el motor de sync guarda en IndexedDB.

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('install', (event) => {
  self.skipWaiting()
})
