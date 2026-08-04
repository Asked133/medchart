// app/actions/auth.ts
// Server Actions para login y logout.
// Se ejecutan exclusivamente en el servidor — la sesión nunca pasa por el cliente.

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email({ message: 'Ingresa un correo válido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
})

export type LoginState = {
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
} | null

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // No expongas detalles internos al cliente
    return { error: 'Correo o contraseña incorrectos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/pacientes')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
