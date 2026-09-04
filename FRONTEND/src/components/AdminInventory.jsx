import { useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../api/client'
import { mediaUrl } from '../api/media'

const emptyItem = {
  name: '',
  code: '',
  stock: 0,
  condition: 'Baik',
  description: '',
  category_id: '',
  image: null,
}

function itemPayload(form, extra = {}) {
  const payload = new FormData()
  payload.append('category_id', String(form.category_id))
  payload.append('name', form.name)
  payload.append('code', form.code)
  payload.append('stock', String(Number(form.stock)))
  payload.append('condition', form.condition || 'Baik')
  payload.append('description', form.description || '')
  if (form.image instanceof File) {
    payload.append('image', form.image)
  }
  Object.entries(extra).forEach(([key, value]) => payload.append(key, value))
  return payload
}

function categoryIdOf(item) {
  return item.category_id || item.category?.id || ''
}

export default function AdminInventory() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [editingId, setEditingId] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileKey, setFileKey] = useState(0)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const [catRes, itemRes] = await Promise.all([api.get('/categories'), api.get('/items')])
    setCategories(catRes.data.data || [])
    setItems(itemRes.data.data || [])
  }

  useEffect(() => {
    load().catch(() => setError('Gagal memuat katalog admin.'))
  }, [])

  useEffect(() => {
    if (!(itemForm.image instanceof File)) {
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(itemForm.image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [itemForm.image])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q) ||
        item.category?.name?.toLowerCase().includes(q)
    )
  }, [items, search])

  const flash = (text) => {
    setMessage(text)
    setError('')
  }

  const addCategory = async (event) => {
    event.preventDefault()
    if (!newCategory.trim()) return
    setBusy(true)
    try {
      const { data } = await api.post('/categories', { name: newCategory.trim() })
      flash(data.message)
      setNewCategory('')
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menambah kategori.'))
    } finally {
      setBusy(false)
    }
  }

  const saveCategory = async (category) => {
    setBusy(true)
    try {
      const { data } = await api.put(`/categories/${category.id}`, { name: category.name })
      flash(data.message)
      setEditingCategory(null)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memperbarui kategori.'))
    } finally {
      setBusy(false)
    }
  }

  const deleteCategory = async (category) => {
    if (!window.confirm(`Hapus kategori "${category.name}"? Barang di dalamnya ikut terhapus.`)) return
    setBusy(true)
    try {
      const { data } = await api.delete(`/categories/${category.id}`)
      flash(data.message)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus kategori.'))
    } finally {
      setBusy(false)
    }
  }

  const startEditItem = (item) => {
    setEditingId(item.id)
    setCurrentImage(item.image || null)
    setFileKey((key) => key + 1)
    setItemForm({
      name: item.name || '',
      code: item.code || '',
      stock: item.stock ?? 0,
      condition: item.condition || 'Baik',
      description: item.description || '',
      category_id: categoryIdOf(item),
      image: null,
    })
  }

  const resetItemForm = () => {
    setEditingId(null)
    setCurrentImage(null)
    setFileKey((key) => key + 1)
    setItemForm({
      ...emptyItem,
      category_id: categories[0]?.id || '',
    })
  }

  const saveItem = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { data } = editingId
        ? await api.post(`/items/${editingId}`, itemPayload(itemForm, { _method: 'PUT' }))
        : await api.post('/items', itemPayload(itemForm))
      flash(data.message)
      resetItemForm()
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyimpan barang.'))
    } finally {
      setBusy(false)
    }
  }

  const patchStock = async (item, delta) => {
    const nextStock = Math.max(0, Number(item.stock || 0) + delta)
    setBusy(true)
    try {
      const { data } = await api.put(`/items/${item.id}`, {
        category_id: Number(categoryIdOf(item)),
        name: item.name,
        code: item.code,
        stock: nextStock,
        condition: item.condition || 'Baik',
        description: item.description || '',
      })
      flash(data.message || 'Stok diperbarui.')
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengubah stok.'))
    } finally {
      setBusy(false)
    }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Hapus produk "${item.name}"?`)) return
    setBusy(true)
    try {
      const { data } = await api.delete(`/items/${item.id}`)
      flash(data.message)
      if (editingId === item.id) resetItemForm()
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menghapus produk.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-head">
        <h2>Kelola Katalog</h2>
        <p className="muted">Tambah kategori, atur stok, sunting, atau hapus produk.</p>
      </div>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="inventory-grid">
        <div className="card inventory-card">
          <h3>Kategori</h3>
          <form className="inline-form" onSubmit={addCategory}>
            <input
              placeholder="Nama kategori baru"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button className="btn-primary" type="submit" disabled={busy}>
              Tambah
            </button>
          </form>
          <ul className="category-manage">
            {categories.map((category) => (
              <li key={category.id}>
                {editingCategory === category.id ? (
                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const name = e.target.elements.name.value
                      saveCategory({ ...category, name })
                    }}
                  >
                    <input name="name" defaultValue={category.name} required />
                    <button className="btn-primary" type="submit" disabled={busy}>
                      Simpan
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setEditingCategory(null)}>
                      Batal
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{category.name}</span>
                    <div className="row-actions">
                      <button type="button" className="btn-ghost" onClick={() => setEditingCategory(category.id)}>
                        Ubah
                      </button>
                      <button type="button" className="btn-danger" onClick={() => deleteCategory(category)}>
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card inventory-card">
          <h3>{editingId ? 'Sunting produk' : 'Produk baru'}</h3>
          <form className="item-form" onSubmit={saveItem}>
            <label>
              Nama
              <input
                value={itemForm.name}
                onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Kode
              <input
                value={itemForm.code}
                onChange={(e) => setItemForm((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </label>
            <label>
              Kategori
              <select
                value={String(itemForm.category_id || '')}
                onChange={(e) => setItemForm((p) => ({ ...p, category_id: e.target.value }))}
                required
              >
                <option value="" disabled>
                  Pilih kategori
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                Stok
                <input
                  type="number"
                  min="0"
                  value={itemForm.stock}
                  onChange={(e) => setItemForm((p) => ({ ...p, stock: e.target.value }))}
                  required
                />
              </label>
              <label>
                Kondisi
                <select
                  value={itemForm.condition}
                  onChange={(e) => setItemForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </label>
            </div>
            <label>
              Deskripsi
              <textarea
                rows="3"
                value={itemForm.description}
                onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
              />
            </label>
            <label className="product-photo">
              Foto produk
              <div className="product-photo-row">
                <span className="product-photo-preview">
                  {preview || mediaUrl(currentImage) ? (
                    <img src={preview || mediaUrl(currentImage)} alt="Pratinjau produk" />
                  ) : (
                    <span>Belum ada foto</span>
                  )}
                </span>
                <input
                  key={fileKey}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={(e) => setItemForm((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                />
              </div>
            </label>
            <div className="row-actions">
              <button className="btn-primary" type="submit" disabled={busy}>
                {editingId ? 'Perbarui produk' : 'Tambah produk'}
              </button>
              {editingId && (
                <button type="button" className="btn-ghost" onClick={resetItemForm}>
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card inventory-card inventory-list">
        <div className="list-head">
          <h3>Daftar produk</h3>
          <input
            className="search compact"
            placeholder="Cari nama, kode, atau kategori"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Kondisi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Belum ada produk.
                  </td>
                </tr>
              )}
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="item-cell">
                      <img src={mediaUrl(item.image) || `https://picsum.photos/seed/${item.id}/80/60`} alt="" />
                      <div>
                        <strong>{item.name}</strong>
                        <p className="muted">{item.code}</p>
                      </div>
                    </div>
                  </td>
                  <td>{item.category?.name || '—'}</td>
                  <td>
                    <div className="stock-stepper">
                      <button type="button" className="btn-ghost" disabled={busy || item.stock <= 0} onClick={() => patchStock(item, -1)}>
                        −
                      </button>
                      <strong>{item.stock}</strong>
                      <button type="button" className="btn-ghost" disabled={busy} onClick={() => patchStock(item, 1)}>
                        +
                      </button>
                    </div>
                  </td>
                  <td>{item.condition}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn-ghost" onClick={() => startEditItem(item)}>
                        Ubah
                      </button>
                      <button type="button" className="btn-danger" onClick={() => deleteItem(item)}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
