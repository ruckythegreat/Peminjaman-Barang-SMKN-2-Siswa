import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('barangky_user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('barangky_token'))
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/user')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('barangky_user', JSON.stringify(res.data))
      })
      .catch(() => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('barangky_token')
        localStorage.removeItem('barangky_user')
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (payload) => {
    const { data } = await api.post('/login', payload)
    localStorage.setItem('barangky_token', data.token)
    localStorage.setItem('barangky_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/register', payload)
    localStorage.setItem('barangky_token', data.token)
    localStorage.setItem('barangky_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {
      /* token already invalid */
    }
    localStorage.removeItem('barangky_token')
    localStorage.removeItem('barangky_user')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
