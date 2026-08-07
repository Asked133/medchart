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
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Tablero</h1>
        <p className="text-foreground-muted text-sm mt-1">
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
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/pacientes"
            id="link-nuevo-paciente"
            className="flex items-center gap-3 p-4 rounded-xl bg-brand-muted hover:bg-brand/20 active:bg-brand/30 border border-brand/20 hover:border-brand/30 text-brand-text transition-all duration-200 shadow-clinical-sm"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Nuevo paciente</div>
              <div className="text-xs opacity-80">Registrar un nuevo expediente</div>
            </div>
          </Link>
          <Link
            href="/pacientes"
            id="link-buscar-paciente"
            className="flex items-center gap-3 p-4 rounded-xl bg-surface hover:bg-surface-hover active:bg-surface-active border border-border-subtle hover:border-border-strong text-foreground-muted hover:text-foreground transition-all duration-200 shadow-clinical-sm"
          >
            <Users className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-foreground">Ver pacientes</div>
              <div className="text-xs">Buscar y ver expedientes</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Actividad del día */}
      <div>
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Actividad de hoy
        </h2>
        {!todayDocs || todayDocs.length === 0 ? (
          <div className="bg-surface border border-border-subtle rounded-xl p-6 text-center text-foreground-muted text-sm shadow-clinical-sm">
            Sin documentos registrados hoy
          </div>
        ) : (
          <div className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle shadow-clinical-sm overflow-hidden">
            {todayDocs.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/pacientes/${doc.patient_id}/documentos/${doc.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground group-hover:text-brand transition-colors">
                      {(doc.patients as any)?.full_name ?? 'Paciente desconocido'}
                    </span>
                    <span className="text-xs text-foreground-muted ml-2">
                      {DOCUMENT_LABELS[doc.document_type] ?? doc.document_type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-foreground-muted group-hover:text-foreground transition-colors">
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
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Últimos pacientes
        </h2>
        {!recentPatients || recentPatients.length === 0 ? (
          <div className="bg-surface border border-border-subtle rounded-xl p-6 text-center text-foreground-muted text-sm shadow-clinical-sm">
            Sin pacientes registrados
          </div>
        ) : (
          <div className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle shadow-clinical-sm overflow-hidden">
            {recentPatients.map((p: any) => (
              <Link
                key={p.id}
                href={`/pacientes/${p.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-text text-sm font-semibold shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-brand transition-colors">
                    {p.full_name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
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
  return (
    <Link href={href} className="
      p-5 rounded-2xl bg-surface border border-border-subtle shadow-clinical-sm
      hover:shadow-clinical hover:border-border-strong hover:-translate-y-0.5
      transition-all duration-300 block group
    ">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand/10 border border-brand/20 group-hover:bg-brand/20 transition-colors">
          <div className="text-brand-text">
            {icon}
          </div>
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground tracking-tight">{value.toLocaleString('es-MX')}</div>
      <div className="text-sm text-foreground-muted mt-1 font-medium">{label}</div>
    </Link>
  )
}
