import { useEffect, useState } from 'react'
import { apiErrorMessage } from '../api/client'
import { mediaUrl } from '../api/media'
import { useAuth } from '../context/AuthContext'

export default function ProfileEditor({ profile, onSaved }) {
  const { updateProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    className: '',
    password: '',
    passwordConfirmation: '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      className: profile?.class || '',
      password: '',
      passwordConfirmation: '',
    })
    setFile(null)
    setPreview(null)
  }, [profile, open])

  useEffect(() => {
    if (!file) return undefined
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.password && form.password !== form.passwordConfirmation) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('email', form.email)
    payload.append('class', form.className)
    if (form.password) {
      payload.append('password', form.password)
      payload.append('password_confirmation', form.passwordConfirmation)
    }
    if (file) payload.append('profile_image', file)

    setSaving(true)
    try {
      const data = await updateProfile(payload)
      setSuccess(data.message || 'Profil berhasil diperbarui.')
      setFile(null)
      onSaved?.(data.data)
      setOpen(false)
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memperbarui profil.'))
    } finally {
      setSaving(false)
    }
  }

  const avatar = preview || mediaUrl(profile?.profile_image)
  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="profile-editor">
      <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
        {open ? 'Tutup form profil' : 'Ubah profil'}
      </button>

      {success && !open && <p className="form-success">{success}</p>}

      {open && (
        <form className="card profile-form" onSubmit={submit}>
          <label className="avatar-upload">
            <span className="avatar-xl">
              {avatar ? <img src={avatar} alt={form.name} /> : <span>{initial}</span>}
            </span>
            <span>
              Ganti foto profil
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </span>
          </label>

          <label>
            Nama
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Kelas
            <input
              value={form.className}
              onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Password baru
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                autoComplete="new-password"
                placeholder="Opsional"
              />
            </label>
            <label>
              Konfirmasi password
              <input
                type="password"
                minLength={8}
                value={form.passwordConfirmation}
                onChange={(e) => setForm((p) => ({ ...p, passwordConfirmation: e.target.value }))}
                autoComplete="new-password"
                placeholder="Ulangi jika ganti"
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan profil'}
          </button>
        </form>
      )}
    </div>
  )
}
