import clsx from 'clsx'

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-slate-100 shadow-card', className)}>
      {children}
    </div>
  )
}

export function StatCard({
  label, value, sub, icon, accent = false
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={clsx(
      'rounded-xl border p-5 flex items-start gap-4',
      accent
        ? 'bg-brand-500 border-brand-400 text-white'
        : 'bg-white border-slate-100 shadow-card'
    )}>
      <div className={clsx(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        accent ? 'bg-white/15' : 'bg-brand-50'
      )}>
        {icon}
      </div>
      <div>
        <div className={clsx('text-2xl font-display font-semibold', accent ? 'text-white' : 'text-slate-900')}>
          {value}
        </div>
        <div className={clsx('text-sm mt-0.5', accent ? 'text-brand-100' : 'text-slate-500')}>{label}</div>
        {sub && <div className={clsx('text-xs mt-1', accent ? 'text-brand-200' : 'text-slate-400')}>{sub}</div>}
      </div>
    </div>
  )
}