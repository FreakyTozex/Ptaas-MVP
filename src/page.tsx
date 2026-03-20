'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', organization_name: '', nif: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form.email, form.password, form.organization_name)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-slate-25 flex items-center justify-center p-8">
      <div className="text-center max-w-sm animate-fade-up">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✉️</span>
        </div>
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-2">Verifique o seu email</h2>
        <p className="text-slate-500 text-sm mb-6">Enviámos um link de confirmação para <strong>{form.email}</strong></p>
        <Link href="/login" className="text-brand-600 font-medium text-sm hover:underline">
          Voltar ao login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-25 flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-brand-500" />
          <span className="font-display font-semibold text-slate-900">PTaaS</span>
        </div>

        <h2 className="font-display text-2xl font-semibold text-slate-900 mb-1">Criar conta</h2>
        <p className="text-slate-500 text-sm mb-8">Registe a sua organização</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'organization_name', label: 'Nome da organização', placeholder: 'Empresa Lda.', type: 'text' },
            { key: 'nif', label: 'NIF (opcional)', placeholder: '123456789', type: 'text' },
            { key: 'email', label: 'Email', placeholder: 'nome@empresa.pt', type: 'email' },
            { key: 'password', label: 'Password', placeholder: 'Mínimo 8 caracteres', type: 'password' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={set(key)}
                placeholder={placeholder}
                required={key !== 'nif'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-3.5 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            {loading ? 'A registar...' : <>Criar conta <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
