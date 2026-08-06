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

  // Rutas exentas / públicas
  const isPublicRoute = pathname === '/login'
  const isChangePasswordRoute = pathname === '/cambiar-contrasena'
  const isDeactivatedRoute = pathname === '/cuenta-desactivada'

  if (!user && !isPublicRoute) {
    // Sin sesión → redirige a login preservando la URL de destino
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    // Consulta única del estado del perfil (is_active y must_change_password)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('must_change_password, is_active')
      .eq('id', user.id)
      .maybeSingle()

    const profile = profileData as { must_change_password: boolean; is_active: boolean } | null
    const isActive = profile?.is_active ?? true
    const mustChangePassword = profile?.must_change_password ?? true

    // 1. Prioridad Absoluta: Cuenta Desactivada
    if (!isActive) {
      if (!isDeactivatedRoute) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/cuenta-desactivada'
        return NextResponse.redirect(redirectUrl)
      }
      return supabaseResponse
    }

    // Si la cuenta está activa pero intenta acceder a la pantalla de cuenta desactivada
    if (isActive && isDeactivatedRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/pacientes'
      return NextResponse.redirect(redirectUrl)
    }

    // 2. Prioridad Secundaria: Cambio obligatorio de contraseña
    if (mustChangePassword && !isChangePasswordRoute) {
      // Bloquea acceso a cualquier otra ruta protegida y fuerza la pantalla de cambio
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/cambiar-contrasena'
      return NextResponse.redirect(redirectUrl)
    }

    if (!mustChangePassword && isChangePasswordRoute) {
      // Si ya no necesita cambiar contraseña, no debe acceder a /cambiar-contrasena
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/pacientes'
      return NextResponse.redirect(redirectUrl)
    }

    if (pathname === '/login' || pathname === '/') {
      // Redirige a la vista correspondiente según su estado de cuenta
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = mustChangePassword ? '/cambiar-contrasena' : '/pacientes'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica el proxy a todas las rutas excepto:
     * - _next/static  (assets estáticos de Next.js)
     * - _next/image   (optimización de imágenes de Next.js)
     * - api/          (rutas de API internas — manejan su propia auth)
     * - favicon.ico
     * - sw.js         (service worker)
     * - manifest.webmanifest
     * - icons/        (íconos PWA)
     * - Archivos estáticos por extensión: imágenes, fuentes, documentos
     */
    '/((?!_next/static|_next/image|api/|favicon\\.ico|sw\\.js|manifest\\.webmanifest|icons/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|xml|txt|json)$).*)',
  ],
}

