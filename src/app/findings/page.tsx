'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, FileText, Download, Filter } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { Finding, Report, Scan, Severity } from '@/types'

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export default function FindingsPage() {
  const { getOrgId } = useAuth()
  const [scans, setScans]           = useState<Scan[]>([])
  const [selectedScan, setSelectedScan] = useState<string>('')
  const [findings, setFindings]     = useState<Finding[]>([])
  const [report, setReport]         = useState<Report | null>(null)
  const [filter, setFilter]         = useState<Severity | 'all'>('all')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [loadingScans, setLoadingScans] = useState(true)

  useEffect(() => {
    const orgId = getOrgId()
    if (!orgId) { setLoadingScans(false); return }
    api.get(`/api/v1/scans/?organization_id=${orgId}&limit=50`)
      .then(r => setScans(r.data.items || []))
      .finally(() => setLoadingScans(false))
  }, [])

  const loadFindings = async (scanId: string) => {
    setLoading(true)
    setFindings([])
    setReport(null)
    try {
      const [fRes, rRes] = await Promise.allSettled([
        api.get(`/api/v1/scans/${scanId}/findings`),
        api.get(`/api/v1/scans/${scanId}/report`),
      ])
      if (fRes.status === 'fulfilled') setFindings(fRes.value.data)
      if (rRes.status === 'fulfilled') setReport(rRes.value.data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = findings.filter(f => filter === 'all' || f.severity === filter)
  const countBySeverity = SEVERITY_ORDER.reduce((acc, s) => ({
    ...acc, [s]: findings.filter(f => f.severity === s).length
  }), {} as Record<Severity, number>)

  return (
    <AppLayout>
      <div className="animate-fade-up">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Findings & Relatório</h1>
          <p className="text-slate-500 text-sm mt-1">Resultados de conformidade RGPD por scan</p>
        </div>

        {/* Scan selector */}
        <Card className="p-4 mb-6 flex items-center gap-4">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select value={selectedScan}
            onChange={e => { setSelectedScan(e.target.value); if (e.target.value) loadFindings(e.target.value) }}
            className="flex-1 text-sm text-slate-700 bg-transparent focus:outline-none">
            <option value="">Selecionar scan...</option>
            {scans.map(s => (
              <option key={s.id} value={s.id}>
                {s.target_url} — {new Date(s.created_at).toLocaleDateString('pt-PT')} ({s.status})
              </option>
            ))}
          </select>
        </Card>

        {/* Report summary */}
        {selectedScan && report && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="p-5 flex flex-col items-center justify-center">
              <div className={`text-4xl font-display font-semibold ${
                report.compliance_score >= 80 ? 'text-green-600' :
                report.compliance_score >= 60 ? 'text-amber-600' : 'text-red-600'
              }`}>{Math.round(report.compliance_score)}</div>
              <div className="text-xs text-slate-500 mt-1">Score RGPD</div>
            </Card>
            {SEVERITY_ORDER.slice(0, 3).map(sev => (
              <Card key={sev} className="p-4">
                <div className="text-2xl font-display font-semibold text-slate-900">{countBySeverity[sev] || 0}</div>
                <SeverityBadge severity={sev} />
              </Card>
            ))}
            {report.pdf_url && (
              <a href={report.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-3 rounded-xl transition-all">
                <Download className="w-4 h-4" /> PDF
              </a>
            )}
          </div>
        )}

        {/* Filter */}
        {findings.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['all', ...SEVERITY_ORDER] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}>
                {s === 'all' ? `Todos (${findings.length})` : `${s} (${countBySeverity[s]})`}
              </button>
            ))}
          </div>
        )}

        {/* Findings */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">A carregar findings...</div>
        ) : !selectedScan ? (
          <Card className="p-12 text-center border-dashed">
            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {loadingScans ? 'A carregar scans...' : scans.length === 0 ? 'Ainda não há scans. Crie o primeiro em Novo Scan.' : 'Selecione um scan para ver os findings'}
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhum finding encontrado</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(finding => (
              <Card key={finding.id} className="overflow-hidden">
                <button onClick={() => setExpanded(expanded === finding.id ? null : finding.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors">
                  <SeverityBadge severity={finding.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{finding.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{finding.category}
                      {finding.rgpd_article && <span className="ml-2 font-mono text-brand-600">{finding.rgpd_article}</span>}
                    </p>
                  </div>
                  {expanded === finding.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expanded === finding.id && (
                  <div className="px-5 pb-5 border-t border-slate-50 animate-fade-in">
                    {finding.description && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-500 mb-1">Descrição</p>
                        <p className="text-sm text-slate-700">{finding.description}</p>
                      </div>
                    )}
                    {finding.recommendation && (
                      <div className="mt-3 bg-brand-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-brand-700 mb-1">💡 Recomendação</p>
                        <p className="text-sm text-brand-800">{finding.recommendation}</p>
                      </div>
                    )}
                    {finding.evidence && Object.keys(finding.evidence).length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-500 mb-1">Evidência</p>
                        <pre className="text-xs bg-slate-50 rounded-lg p-3 overflow-auto text-slate-700 font-mono">
                          {JSON.stringify(finding.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}