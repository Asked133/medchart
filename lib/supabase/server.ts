// lib/supabase/server.ts
// Cliente de servidor — se usa en Server Components, Server Actions y Route Handlers.
// Nunca lo importes desde un archivo 'use client'.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll se llama desde un Server Component — seguro ignorarlo.
            // El middleware se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}
