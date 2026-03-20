'use client'
import { useState } from 'react'
import { Search, Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { ScanType, Scan } from '@/types'

const SCAN_TYPES: { value: ScanType; label: string; desc: string }[] = [
  { value: 'full',           label: 'Scan Completo',           desc: 'Análise RGPD completa — recomendado' },
  { value: 'cookies',        label: 'Cookies',                 desc: 'Auditoria de cookies e rastreadores' },
  { value: 'privacy_policy', label: 'Política de Privacidade', desc: 'Análise do documento de privacidade' },
  { value: 'data_transfers', label: 'Transferências de Dados', desc: 'Mapeamento de terceiros' },
  { value: 'forms',          label: 'Formulários',             desc: 'Recolha de dados pessoais' },
]

export default function ScanPage() {
  const { getOrgId } = useAuth()
  const [url, setScanUrl]     = useState('')
  const [scanType, setScanType] = useState<ScanType>('full')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [scan, setScan]       = useState<Scan | null>(null)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setScan(null)

    const orgId = getOrgId()
    if (!orgId) {
      setError('Organização não encontrada. Por favor faça login novamente.')
      setLoading(false)
      return
    }

    try {
      const { data } = await api.post('/api/v1/scans/', {
        target_url:      url,
        scan_type:       scanType,
        organization_id: orgId,
        notify_email:    email || undefined,
      })
      setScan(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao iniciar scan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="animate-fade-up">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-slate-900">Novo Scan RGPD</h1>
          <p className="text-slate-500 text-sm mt-1">Analise a conformidade de um website</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">URL do website</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="url" value={url} onChange={e => setScanUrl(e.target.value)}
                      placeholder="https://exemplo.pt" required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:shadow-input transition-all font-mono" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de scan</label>
                  <div className="space-y-2">
                    {SCAN_TYPES.map(({ value, label, desc }) => (
                      <label key={value}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                          scanType === value ? 'border-brand-400 bg-brand-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}>
                        <input type="radio" name="scan_type" value={value}
                          checked={scanType === value} onChange={() => setScanType(value)}
                          className="mt-0.5 accent-brand-500" />
                        <div>
                          <div className="text-sm font-medium text-slate-800">{label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                        </div>
                        {value === 'full' && (
                          <span className="ml-auto text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                            Recomendado
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notificação por email <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="notificar@empresa.pt"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:shadow-input transition-all" />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-3.5 py-2.5 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> A iniciar scan...</>
                    : <><Search className="w-4 h-4" /> Iniciar Scan</>}
                </button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {scan ? (
              <Card className="p-5 animate-fade-up">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-slate-800">Scan iniciado!</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estado</span>
                    <StatusBadge status={scan.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">URL</span>
                    <span className="text-slate-800 font-mono text-xs truncate max-w-36">{scan.target_url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipo</span>
                    <span className="text-slate-800">{scan.scan_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID</span>
                    <span className="text-slate-500 font-mono text-xs">{scan.id.slice(0, 8)}…</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progresso</span><span>{scan.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${scan.status === 'running' ? 'progress-animated' : 'bg-brand-500'}`}
                      style={{ width: `${scan.progress || 5}%` }} />
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <h3 className="text-sm font-medium text-slate-700 mb-3">O que é analisado?</h3>
                <ul className="space-y-2.5">
                  {[
                    ['🍪', 'Cookies e rastreadores', 'Categorização e conformidade Art. 7'],
                    ['📄', 'Política de privacidade', 'Completude e clareza Art. 13/14'],
                    ['🔗', 'Terceiros', 'Transferências de dados Art. 28/44'],
                    ['📝', 'Formulários', 'Recolha e base legal Art. 5'],
                  ].map(([emoji, title, desc]) => (
                    <li key={title as string} className="flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5">{emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{title}</div>
                        <div className="text-xs text-slate-400">{desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card className="p-5 bg-amber-50 border-amber-100">
              <p className="text-xs text-amber-700">
                <strong>Nota:</strong> O scan analisa apenas dados publicamente acessíveis. Não acede a áreas autenticadas.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}