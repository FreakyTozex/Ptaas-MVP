'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email ou password incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-25 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-500 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-white font-semibold text-lg">PTaaS</span>
          </div>
          <h1 className="font-display text-4xl text-white font-light leading-tight">
            Conformidade RGPD<br /><span className="font-semibold">automatizada.</span>
          </h1>
          <p className="text-brand-100 mt-4 text-lg leading-relaxed">
            Analise vulnerabilidades, monitorize cookies e gere relatórios de conformidade com um clique.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['98%', 'Precisão'], ['< 5min', 'Por scan'], ['RGPD', 'Conforme']].map(([val, label]) => (
            <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
              <div className="font-display text-2xl text-white font-semibold">{val}</div>
              <div className="text-brand-200 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-brand-500" />
            <span className="font-display font-semibold text-slate-900">PTaaS</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-slate-900 mb-1">Bem-vindo</h2>
          <p className="text-slate-500 text-sm mb-8">Inicie sessão na sua conta</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nome@empresa.pt" required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:shadow-input transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:shadow-input transition-all pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading ? 'A entrar...' : <>Entrar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Não tem conta?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">Registar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}