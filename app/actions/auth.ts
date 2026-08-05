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

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !authData.user) {
    // No expongas detalles internos al cliente
    return { error: 'Correo o contraseña incorrectos.' }
  }

  // Obtener estado del perfil en una sola consulta
  const { data: profileData } = await supabase
    .from('profiles')
    .select('must_change_password, is_active')
    .eq('id', authData.user.id)
    .single()

  const profile = profileData as { must_change_password: boolean; is_active: boolean } | null
  const isActive = profile?.is_active ?? true
  const mustChangePassword = profile?.must_change_password ?? false

  // 1. PRIMER CHEQUEO (PRIORIDAD ABSOLUTA): Cuenta Desactivada
  if (!isActive) {
    await supabase.auth.signOut()
    return { error: 'Esta cuenta ha sido desactivada. Contacta al administrador.' }
  }

  revalidatePath('/', 'layout')

  // 2. SEGUNDO CHEQUEO: Cambio obligatorio de contraseña
  if (mustChangePassword) {
    redirect('/cambiar-contrasena')
  }

  redirect('/pacientes')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ── Cambio Obligatorio de Contraseña ───────────────────────────────────

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string().min(1, { message: 'Confirma tu contraseña.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type ChangePasswordState = {
  error?: string
  fieldErrors?: {
    password?: string[]
    confirmPassword?: string[]
  }
} | null

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const raw = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const parsed = changePasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No hay una sesión activa.' }
  }

  // 1. Actualiza la contraseña en Supabase Auth
  const { error: updateAuthError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (updateAuthError) {
    return { error: 'No se pudo actualizar la contraseña. Inténtalo de nuevo.' }
  }

  // 2. Desmarca el flag obligatorio en el perfil del usuario
  const { error: updateProfileError } = await (supabase
    .from('profiles') as any)
    .update({ must_change_password: false })
    .eq('id', user.id)

  if (updateProfileError) {
    return { error: 'Error al actualizar el perfil. Inténtalo de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/pacientes')
}
