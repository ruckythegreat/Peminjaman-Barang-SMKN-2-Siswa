import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { user, login, register } = useAuth()
  const location = useLocation()
  const isSignup = location.pathname === '/signup'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    className: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/lobby" replace />
  }

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isSignup) {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          class: form.className,
        })
      } else {
        await login({
          email: form.email,
          password: form.password,
        })
      }
    } catch (err) {
      const data = err.response?.data
      const firstValidation = data?.errors ? Object.values(data.errors)[0]?.[0] : null
      setError(firstValidation || data?.message || 'Gagal memproses permintaan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>{isSignup ? 'Sign Up' : 'Login'}</h1>
        <p className="muted">
          {isSignup
            ? 'Buat akun baru untuk mulai meminjam barang.'
            : 'Masuk untuk mengelola peminjaman barang sekolah.'}
        </p>

        {isSignup && (
          <label>
            Nama
            <input name="name" value={form.name} onChange={onChange} required autoComplete="name" />
          </label>
        )}

        <label>
          {isSignup ? 'Email' : 'Username/Email'}
          <input
            name="email"
            type={isSignup ? 'email' : 'text'}
            value={form.email}
            onChange={onChange}
            required
            autoComplete={isSignup ? 'email' : 'username'}
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>

        {isSignup && (
          <label>
            Kelas
            <input
              name="className"
              value={form.className}
              onChange={onChange}
              required
              placeholder="Contoh: XII RPL 1"
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Memproses…' : isSignup ? 'Sign Up' : 'Login'}
        </button>

        {isSignup ? (
          <p className="auth-switch">
            Sudah punya akun? <Link to="/">Login</Link>
          </p>
        ) : (
          <p className="auth-switch">
            Belum buat akun? <Link to="/signup">Sign Up</Link>
          </p>
        )}
      </form>
    </div>
  )
}
