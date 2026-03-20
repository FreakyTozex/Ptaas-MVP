'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Search, CheckCircle, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Scan, Report } from '@/types'

export default function DashboardPage() {
  const { getOrgId } = useAuth()
  const [scans, setScans]     = useState<Scan[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const orgId = getOrgId()
    if (!orgId) { setLoading(false); return }

    const fetchData = async () => {
      try {
        const scansResp = await api.get(`/api/v1/scans/?organization_id=${orgId}&limit=10`)
        setScans(scansResp.data.items || [])
      } catch (e) {
        console.error('Erro ao carregar scans', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Realtime updates a cada 10s se houver scans a correr
    const interval = setInterval(() => {
      if (scans.some(s => s.status === 'running')) fetchData()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const completedScans = scans.filter(s => s.status === 'completed').length
  const runningScans   = scans.filter(s => s.status === 'running').length
  const avgScore       = reports.length
    ? Math.round(reports.reduce((a, r) => a + r.compliance_score, 0) / reports.length)
    : null

  const scoreData = avgScore !== null ? [{ value: avgScore }] : []

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Visão geral da conformidade RGPD</p>
        </div>
        <Link href="/scan"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all">
          <Search className="w-4 h-4" /> Novo Scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-up">
        <StatCard label="Score médio" value={avgScore !== null ? `${avgScore}%` : '—'}
          sub="Conformidade RGPD" icon={<Shield className="w-5 h-5 text-white" />} accent />
        <StatCard label="Scans totais" value={scans.length || '—'}
          icon={<Search className="w-5 h-5 text-brand-600" />} />
        <StatCard label="Concluídos" value={completedScans || '—'}
          icon={<CheckCircle className="w-5 h-5 text-brand-600" />} />
        <StatCard label="Em curso" value={runningScans || '—'}
          icon={<Clock className="w-5 h-5 text-brand-600" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Score gauge */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-slate-600 mb-4">Score de Conformidade</h3>
          {avgScore !== null ? (
            <>
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%"
                    startAngle={210} endAngle={-30} data={scoreData}>
                    <RadialBar dataKey="value" maxBarSize={12}
                      fill={avgScore >= 80 ? '#2e9d96' : avgScore >= 60 ? '#ca8a04' : '#dc2626'}
                      background={{ fill: '#f1f5f9' }} cornerRadius={6} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-3xl font-semibold text-slate-900">{avgScore}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3">
                {avgScore >= 80 ? '✅ Conforme' : avgScore >= 60 ? '⚠️ Melhorias necessárias' : '🚨 Não conforme'}
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Sem dados ainda</p>
              <Link href="/scan" className="text-xs text-brand-600 mt-2 block hover:underline">
                Criar primeiro scan →
              </Link>
            </div>
          )}
        </Card>

        {/* Recent scans */}
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Scans Recentes</h3>
            <Link href="/scan" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400">A carregar...</div>
            ) : scans.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Nenhum scan realizado</p>
                <Link href="/scan"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-brand-600 hover:underline">
                  Iniciar primeiro scan <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : scans.slice(0, 5).map(scan => (
              <div key={scan.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate font-mono">{scan.target_url}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(scan.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
                <StatusBadge status={scan.status} />
                {scan.status === 'running' && (
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full progress-animated rounded-full" style={{ width: `${scan.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {scans.length === 0 && !loading && (
        <Card className="p-8 text-center border-dashed">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
            Comece a monitorizar a sua conformidade
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Insira o URL do seu website para analisar cookies, política de privacidade e transferências de dados.
          </p>
          <Link href="/scan"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all">
            <Search className="w-4 h-4" /> Criar primeiro scan
          </Link>
        </Card>
      )}
    </AppLayout>
  )
}