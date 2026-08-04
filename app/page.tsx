// app/page.tsx — Ruta raíz
// Redirige inmediatamente al tablero. El middleware se encarga de redirigir al login
// si no hay sesión activa.

import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/pacientes')
}
