// app/(protected)/tablero/page.tsx — Tablero principal (Server Component)
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, FileText, PlusCircle, Clock, ChevronRight, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tablero | MedChart',
  description: 'Resumen de tu práctica clínica: pacientes, documentos y actividad reciente.',
}

const DOCUMENT_LABELS: Record<string, string> = {
  historia_clinica: 'Historia Clínica',
  nota_evolucion: 'Nota de Evolución',
}

export default async function TableroPage() {
  const supabase = await createClient()

  // Conteo total de pacientes
  const { count: patientCount } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })

  // Conteo total de documentos
  const { count: documentCount } = await supabase
    .from('clinical_documents')
    .select('id', { count: 'exact', head: true })

  // Actividad de hoy: documentos del día actual
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data: todayDocs } = await supabase
    .from('clinical_documents')
    .select('id, document_type, document_date, patient_id, patients(full_name)')
    .gte('document_date', todayStart.toISOString())
    .order('document_date', { ascending: false })
    .limit(8)

  // Últimos pacientes registrados (acceso rápido)
  const { data: recentPatients } = await supabase
    .from('patients')
    .select('id, full_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Tablero</h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/pacientes"
            id="link-nuevo-paciente"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 border border-blue-500/20 hover:border-blue-400/30 text-blue-300 hover:text-blue-200 transition-all duration-200"
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
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all duration-200"
          >
            <Users className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-medium">Ver pacientes</div>
              <div className="text-xs text-slate-500">Buscar y ver expedientes</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Actividad del día */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Actividad de hoy
        </h2>
        {!todayDocs || todayDocs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
            Sin documentos registrados hoy
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {todayDocs.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/pacientes/${doc.patient_id}/documentos/${doc.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                      {(doc.patients as any)?.full_name ?? 'Paciente desconocido'}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      {DOCUMENT_LABELS[doc.document_type] ?? doc.document_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {new Date(doc.document_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Últimos pacientes */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Últimos pacientes
        </h2>
        {!recentPatients || recentPatients.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
            Sin pacientes registrados
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
            {recentPatients.map((p: any) => (
              <Link
                key={p.id}
                href={`/pacientes/${p.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm font-semibold shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                    {p.full_name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        )}
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
