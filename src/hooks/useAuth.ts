'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface User { id: string; email: string }

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/v1/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)

    // Buscar organização do utilizador e guardar o org_id
    const orgsResp = await api.get('/api/v1/organizations/')
    if (orgsResp.data && orgsResp.data.length > 0) {
      localStorage.setItem('org_id', orgsResp.data[0].id)
      localStorage.setItem('org_name', orgsResp.data[0].name)
    }

    return data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('org_id')
    localStorage.removeItem('org_name')
    setUser(null)
    window.location.href = '/login'
  }

  const register = async (email: string, password: string, organization_name: string, nif?: string) => {
    const { data } = await api.post('/api/v1/auth/register', {
      email, password, organization_name, nif
    })
    return data
  }

  const getOrgId = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('org_id') || ''
    return ''
  }

  return { user, loading, login, logout, register, getOrgId }
}