// app/login/page.tsx — Server Component
// No tiene estado propio. Solo renderiza el Client Component LoginForm.

import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión — MedChart',
  description: 'Acceso al sistema de historias clínicas MedChart.',
  robots: 'noindex, nofollow', // La app no debe indexarse
}

export default function LoginPage() {
  return <LoginForm />
}
