// app/(protected)/tablero/page.tsx — Tablero principal (Server Component)
// Placeholder mientras construyes las secciones específicas.

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, FileText, PlusCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tablero',
}

export default async function TableroPage() {
  const supabase = await createClient()

  // Conteo de pacientes del médico
  const { count: patientCount } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })

  // Conteo de documentos del médico
  const { count: documentCount } = await supabase
    .from('clinical_documents')
    .select('id', { count: 'exact', head: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Tablero</h1>
        <p className="text-slate-400 text-sm mt-1">
          Resumen de tu práctica clínica
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-400" />}
          label="Pacientes registrados"
          value={patientCount ?? 0}
          href="/pacientes"
          color="blue"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-violet-400" />}
          label="Documentos clínicos"
          value={documentCount ?? 0}
          href="/pacientes"
          color="violet"
        />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/pacientes"
            id="link-nuevo-paciente"
            className="
              flex items-center gap-3 p-4 rounded-xl
              bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30
              border border-blue-500/20 hover:border-blue-400/30
              text-blue-300 hover:text-blue-200
              transition-all duration-200 group
            "
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-medium">Nuevo paciente</div>
              <div className="text-xs text-blue-400/70">Registrar un nuevo expediente</div>
            </div>
          </Link>
          <Link
            href="/pacientes"
            id="link-buscar-paciente"
            className="
              flex items-center gap-3 p-4 rounded-xl
              bg-white/5 hover:bg-white/10 active:bg-white/15
              border border-white/10 hover:border-white/20
              text-slate-300 hover:text-white
              transition-all duration-200
            "
          >
            <Users className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-medium">Ver pacientes</div>
              <div className="text-xs text-slate-500">Buscar y ver expedientes</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  href: string
  color: 'blue' | 'violet'
}) {
  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    violet: 'bg-violet-500/10 border-violet-500/20',
  }

  return (
    <Link href={href} className={`
      p-5 rounded-2xl border ${colorMap[color]}
      hover:scale-[1.01] active:scale-[0.99]
      transition-all duration-200 block
    `}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value.toLocaleString('es-MX')}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </Link>
  )
}
