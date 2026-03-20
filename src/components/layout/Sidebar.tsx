'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, LayoutDashboard, Search, FileText, Cookie, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/scan',      label: 'Novo Scan',    icon: Search },
  { href: '/findings',  label: 'Findings',     icon: FileText },
  { href: '/consent',   label: 'Consentimento',icon: Cookie },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display font-semibold text-slate-900 text-sm">PTaaS</span>
            <div className="text-xs text-slate-400 font-mono leading-none mt-0.5">RGPD Scanner</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon className={clsx('w-4 h-4', active ? 'text-brand-600' : 'text-slate-400')} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="px-3 py-2 mb-1">
          <div className="text-xs font-medium text-slate-800 truncate">{user?.email}</div>
          <div className="text-xs text-slate-400 mt-0.5">Administrador</div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Terminar sessão
        </button>
      </div>
    </aside>
  )
}