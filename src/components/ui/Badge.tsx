import clsx from 'clsx'
import type { Severity, ScanStatus, ConsentStatus } from '@/types'

export function SeverityBadge({ severity }: { severity: Severity }) {
  const labels: Record<Severity, string> = {
    critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo', info: 'Info'
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-mono', `badge-${severity}`)}>
      {labels[severity]}
    </span>
  )
}

export function StatusBadge({ status }: { status: ScanStatus }) {
  const map: Record<ScanStatus, { label: string; color: string }> = {
    pending:   { label: 'Pendente',   color: 'bg-slate-100 text-slate-600' },
    running:   { label: 'A correr',   color: 'bg-blue-50 text-blue-600' },
    completed: { label: 'Concluído',  color: 'bg-green-50 text-green-700' },
    failed:    { label: 'Falhado',    color: 'bg-red-50 text-red-600' },
    cancelled: { label: 'Cancelado',  color: 'bg-slate-100 text-slate-500' },
  }
  const { label, color } = map[status]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', color)}>
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {label}
    </span>
  )
}

export function ConsentBadge({ status }: { status: ConsentStatus }) {
  const map: Record<ConsentStatus, string> = {
    compliant:     'Conforme',
    non_compliant: 'Não Conforme',
    partial:       'Parcial',
    unknown:       'Desconhecido',
  }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', `status-${status}`)}>
      {map[status]}
    </span>
  )
}