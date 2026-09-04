import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { publicUser } from '../api/media'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('barangky_user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('barangky_token'))
  const [loading, setLoading] = useState(Boolean(token))

  const persistUser = (next) => {
    const mapped = publicUser(next)
    setUser(mapped)
    if (mapped) localStorage.setItem('barangky_user', JSON.stringify(mapped))
    else localStorage.removeItem('barangky_user')
    return mapped
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/user')
      .then((res) => persistUser(res.data))
      .catch(() => {
        persistUser(null)
        setToken(null)
        localStorage.removeItem('barangky_token')
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (payload) => {
    const { data } = await api.post('/login', payload)
    localStorage.setItem('barangky_token', data.token)
    persistUser(data.user)
    setToken(data.token)
    return data
  }

  const register = async (payload) => {
    const { data } = await api.post('/register', payload)
    localStorage.setItem('barangky_token', data.token)
    persistUser(data.user)
    setToken(data.token)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {
      /* token already invalid */
    }
    localStorage.removeItem('barangky_token')
    persistUser(null)
    setToken(null)
  }

  const updateProfile = async (formData) => {
    const { data } = await api.post('/profile', formData)
    persistUser(data.data)
    return data
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateProfile, setUser: persistUser }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
