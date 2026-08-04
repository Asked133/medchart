// lib/supabase/client.ts
// Cliente de browser — se usa en Client Components ('use client')
// Solo usa la anon key pública. Nunca la service role key.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
