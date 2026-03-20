'use client'
import { useState, useEffect } from 'react'
import { Cookie, Plus, RefreshCw, Code, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { ConsentBadge } from '@/components/ui/Badge'
import api from '@/lib/api'
import type { ConsentDomain } from '@/types'

export default function ConsentPage() {
  const [domains, setDomains]       = useState<ConsentDomain[]>([])
  const [showForm, setShowForm]     = useState(false)
  const [domain, setDomain]         = useState('')
  const [language, setLanguage]     = useState('pt')
  const [loading, setLoading]       = useState(false)
  const [scanning, setScanning]     = useState<string | null>(null)
  const [snippet, setSnippet]       = useState<{ domainId: string; html: string } | null>(null)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const registerDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const orgId = localStorage.getItem('org_id') || '00000000-0000-0000-0000-000000000000'
      const { data } = await api.post('/api/v1/consent/domains', {
        domain, language, regulation: 'gdpr', organization_id: orgId
      })
      setDomains(d => [data, ...d])
      setShowForm(false)
      setDomain('')
      setSuccess('Domínio registado com sucesso!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registar domínio')
    } finally {
      setLoading(false)
    }
  }

  const scanDomain = async (domainId: string) => {
    setScanning(domainId)
    try {
      await api.post(`/api/v1/consent/domains/${domainId}/scan`)
      setSuccess('Scan de consentimento iniciado!')
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Erro ao iniciar scan')
    } finally {
      setScanning(null)
    }
  }

  const getSnippet = async (domainId: string) => {
    try {
      const { data } = await api.get(`/api/v1/consent/domains/${domainId}/snippet`)
      setSnippet({ domainId, html: data.html_snippet || data.js_url })
    } catch {
      setError('Erro ao obter snippet')
    }
  }

  return (
    <AppLayout>
      <div className="animate-fade-up">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">Gestão de Consentimento</h1>
            <p className="text-slate-500 text-sm mt-1">Banner de cookies e conformidade RGPD Art. 7 via Securiti.ai</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo domínio
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-lg mb-4 animate-fade-in">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Register form */}
        {showForm && (
          <Card className="p-6 mb-6 animate-fade-up border-brand-100">
            <h3 className="text-sm font-medium text-slate-800 mb-4">Registar domínio no Securiti.ai</h3>
            <form onSubmit={registerDomain} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Domínio</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="exemplo.pt"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:shadow-input transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Idioma do banner</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-all"
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-60">
                  {loading ? 'A registar...' : 'Registar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-slate-600 hover:text-slate-800 text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Snippet modal */}
        {snippet && (
          <Card className="p-5 mb-6 border-slate-200 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Script para incluir no seu website</span>
              </div>
              <button onClick={() => setSnippet(null)} className="text-xs text-slate-400 hover:text-slate-600">Fechar</button>
            </div>
            <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-4 overflow-auto font-mono">
              {snippet.html}
            </pre>
            <p className="text-xs text-slate-400 mt-2">
              Cole este script antes do <code className="font-mono text-slate-600">&lt;/head&gt;</code> do seu site.
            </p>
          </Card>
        )}

        {/* Domains list */}
        {domains.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Cookie className="w-7 h-7 text-brand-400" />
            </div>
            <h3 className="font-display text-base font-semibold text-slate-800 mb-2">
              Nenhum domínio registado
            </h3>
            <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
              Registe um domínio para gerar o banner de cookies e monitorizar a conformidade RGPD Art. 7.
            </p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all">
              <Plus className="w-4 h-4" /> Registar domínio
            </button>
          </Card>
        ) : (
          <div className="space-y-3">
            {domains.map(d => (
              <Card key={d.id} className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 font-mono">{d.domain}</span>
                      <ConsentBadge status={d.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {d.regulation.toUpperCase()} · {d.language.toUpperCase()}
                      {d.last_scan_at && ` · Último scan: ${new Date(d.last_scan_at).toLocaleDateString('pt-PT')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => getSnippet(d.id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                      <Code className="w-3 h-3" /> Script
                    </button>
                    <button onClick={() => scanDomain(d.id)}
                      disabled={scanning === d.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-all disabled:opacity-60">
                      <RefreshCw className={`w-3 h-3 ${scanning === d.id ? 'animate-spin' : ''}`} />
                      {scanning === d.id ? 'A analisar...' : 'Analisar'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <div className="text-blue-500 flex-shrink-0 mt-0.5">ℹ️</div>
          <div className="text-xs text-blue-700">
            <strong>Securiti.ai</strong> categoriza automaticamente os cookies do seu website, gera o banner de consentimento em conformidade com o RGPD Art. 7 e atualiza-o quando novos cookies são detetados.
          </div>
        </div>
      </div>
    </AppLayout>
  )
}