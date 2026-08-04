// proxy.ts — en la raíz del proyecto (junto a next.config.ts)
// Next.js 16: 'middleware' fue renombrado a 'proxy'. La función también cambia de nombre.
// Protege todas las rutas y redirige a /login si no hay sesión activa.
// También refresca el token de Supabase en cada request.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: no escribas lógica entre createServerClient y getUser().
  // Cualquier await entre los dos puede invalidar el refresh de la sesión.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren sesión
  const isPublicRoute = pathname === '/login'

  if (!user && !isPublicRoute) {
    // Sin sesión → redirige a login preservando la URL de destino
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && (pathname === '/login' || pathname === '/')) {
    // Ya tiene sesión → redirige a la lista de pacientes
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/pacientes'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica el proxy a todas las rutas excepto:
     * - _next/static  (assets estáticos)
     * - _next/image   (optimización de imágenes)
     * - favicon.ico
     * - sw.js         (service worker)
     * - manifest.webmanifest
     * - íconos en /icons/*
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)',
  ],
}
