// app/cambiar-contrasena/page.tsx — Server Component
// Renderiza el Client Component ChangePasswordForm.

import type { Metadata } from 'next'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata: Metadata = {
  title: 'Actualizar contraseña — MedChart',
  description: 'Cambio obligatorio de contraseña por privacidad y seguridad.',
  robots: 'noindex, nofollow',
}

export default function ChangePasswordPage() {
  return <ChangePasswordForm />
}
