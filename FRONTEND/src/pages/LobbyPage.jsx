import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const FILTERS = [
  { key: 'available', label: 'Tersedia', type: 'stock' },
  { key: 'unavailable', label: 'Tidak Tersedia', type: 'stock' },
  { key: 'Alat', label: 'Alat', type: 'category' },
  { key: 'Buku', label: 'Buku', type: 'category' },
  { key: 'Lainnya', label: 'Lainnya', type: 'category' },
]

function itemImage(item) {
  if (item.image) return item.image
  const seed = encodeURIComponent(item.name || item.id)
  return `https://picsum.photos/seed/${seed}/640/420`
}

export default function LobbyPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [outstanding, setOutstanding] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [checks, setChecks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    quantity: 1,
    start: '',
    end: '',
    reason: '',
  })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    api
      .get('/profile')
      .then((res) => setOutstanding(res.data.data?.outstanding_count ?? 0))
      .catch(() => setOutstanding(0))
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')

    const params = {}
    if (debouncedSearch) params.search = debouncedSearch

    api
      .get('/items', { params })
      .then((res) => {
        if (!ignore) setItems(res.data.data || [])
      })
      .catch(() => {
        if (!ignore) setError('Katalog tidak dapat dimuat. Pastikan API Laravel sedang berjalan.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [debouncedSearch])

  const filtered = useMemo(() => {
    const stockKeys = ['available', 'unavailable'].filter((key) => checks[key])
    const categoryKeys = ['Alat', 'Buku', 'Lainnya'].filter((key) => checks[key])

    return items.filter((item) => {
      const inStock = (item.stock ?? 0) > 0
      const stockOk =
        stockKeys.length === 0 ||
        (stockKeys.includes('available') && inStock) ||
        (stockKeys.includes('unavailable') && !inStock)

      const categoryName = item.category?.name || 'Lainnya'
      const categoryOk = categoryKeys.length === 0 || categoryKeys.includes(categoryName)

      return stockOk && categoryOk
    })
  }, [items, checks])

  const toggleCheck = (key) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const openItem = (item) => {
    setSelected(item)
    setShowForm(false)
    setFormError('')
    setFormSuccess('')
    setForm({
      quantity: 1,
      start: '',
      end: '',
      reason: '',
    })
  }

  const closeModal = () => {
    setSelected(null)
    setShowForm(false)
  }

  const submitBorrow = async (event) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')
    setSubmitting(true)
    try {
      await api.post('/borrowings', {
        borrowing_date: form.start,
        return_date: form.end,
        reason: form.reason,
        items: [{ item_id: selected.id, quantity: Number(form.quantity) }],
      })
      setFormSuccess('Pengajuan peminjaman berhasil dibuat.')
      const profile = await api.get('/profile')
      setOutstanding(profile.data.data?.outstanding_count ?? outstanding)
    } catch (err) {
      const data = err.response?.data
      setFormError(data?.message || 'Gagal mengajukan peminjaman.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page lobby">
      <section className="lobby-header">
        <h1>
          Selamat datang {user?.name}, kamu memiliki [{outstanding}] barang yang belum dikembalikan.
        </h1>
        <input
          className="search"
          type="search"
          placeholder="Cari barang atau kode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="lobby-body">
        <aside className="card sidebar">
          <h2>Filter</h2>
          {FILTERS.map((filter) => (
            <label key={filter.key} className="check-row">
              <input
                type="checkbox"
                checked={Boolean(checks[filter.key])}
                onChange={() => toggleCheck(filter.key)}
              />
              {filter.label}
            </label>
          ))}
        </aside>

        <div className="catalog">
          {loading && <p className="muted">Memuat katalog…</p>}
          {error && <p className="form-error">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="muted">Tidak ada barang yang cocok dengan pencarian atau filter.</p>
          )}
          <div className="grid">
            {filtered.map((item) => (
              <button key={item.id} type="button" className="card product-card" onClick={() => openItem(item)}>
                <div className="product-thumb">
                  <img src={itemImage(item)} alt={item.name} />
                </div>
                <h3>{item.name}</h3>
                <p className="muted">Stock: [{item.stock}]</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div className="card modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Tutup">
              ×
            </button>
            <img className="detail-image" src={itemImage(selected)} alt={selected.name} />
            <h2>{selected.name}</h2>
            <p className="muted">Sisa Stock: {selected.stock}</p>
            {selected.description && <p className="detail-desc">{selected.description}</p>}

            {!showForm ? (
              <button
                type="button"
                className="btn-primary"
                disabled={selected.stock <= 0}
                onClick={() => setShowForm(true)}
              >
                Pinjam Barang
              </button>
            ) : (
              <form className="borrow-form" onSubmit={submitBorrow}>
                <label>
                  Banyak dipinjam
                  <input
                    type="number"
                    min="1"
                    max={selected.stock}
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                    required
                  />
                </label>
                <fieldset>
                  <legend>Tanggal Pinjaman</legend>
                  <div className="date-range">
                    <input
                      type="date"
                      value={form.start}
                      onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
                      required
                      aria-label="Tanggal awal"
                    />
                    <span>hingga</span>
                    <input
                      type="date"
                      value={form.end}
                      onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
                      required
                      aria-label="Tanggal akhir"
                    />
                  </div>
                </fieldset>
                <label>
                  Alasan Pinjam
                  <textarea
                    rows="4"
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    required
                  />
                </label>
                {formError && <p className="form-error">{formError}</p>}
                {formSuccess && <p className="form-success">{formSuccess}</p>}
                <button className="btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Mengirim…' : 'Pinjam'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
