import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import PieChart from '../components/PieChart'
import { useAuth } from '../context/AuthContext'

function statusClass(status) {
  if (status === 'Dikembalikan') return 'ok'
  if (status === 'Ditolak' || status === 'Terlambat') return 'bad'
  if (status === 'Dipinjam') return 'warn'
  return 'pending'
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [pending, setPending] = useState([])
  const [openId, setOpenId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')

  const isAdmin = (profile?.role || user?.role) === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      const profileRes = await api.get('/profile')
      setProfile(profileRes.data.data)
      if ((profileRes.data.data.role || user?.role) === 'admin') {
        const list = await api.get('/borrowings', { params: { status: 'Diajukan' } })
        setPending(list.data.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const act = async (id, action) => {
    setActionMessage('')
    try {
      const { data } = await api.post(`/borrowings/${id}/${action}`)
      setActionMessage(data.message)
      await load()
      setOpenId(null)
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Aksi gagal.')
    }
  }

  if (loading && !profile) {
    return (
      <div className="page">
        <p className="muted">Memuat dashboard…</p>
      </div>
    )
  }

  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'U'
  const stats = profile?.stats || {}
  const rows = profile?.borrowings || []

  return (
    <div className="page dashboard">
      <section className="profile-header">
        <div className="avatar-xl">
          {profile?.profile_image ? (
            <img src={profile.profile_image} alt={profile.name} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div>
          <h1>{profile?.name}</h1>
          <p className="muted">
            {profile?.class || 'Kelas belum diisi'} / {profile?.role === 'admin' ? 'Admin' : 'Siswa'}
          </p>
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="card history-card">
        <div className="history-left">
          <ul className="stat-list">
            <li>
              <span>Buku dipinjam</span>
              <strong>{stats.books_borrowed ?? 0}</strong>
            </li>
            <li>
              <span>Selesai dipinjam</span>
              <strong>{stats.completed ?? 0}</strong>
            </li>
            <li>
              <span>Lupa di kembalikan</span>
              <strong>{stats.forgotten ?? 0}</strong>
            </li>
            <li>
              <span>Dalam proses</span>
              <strong>{stats.in_process ?? 0}</strong>
            </li>
          </ul>
          <p className={profile?.account_status === 'Baik' ? 'account-ok' : 'account-bad'}>
            Status akun = {profile?.account_status || 'Baik'}
          </p>
        </div>
        <div className="history-right">
          <h2>Kategori paling sering dipinjam</h2>
          <PieChart slices={profile?.category_chart || []} />
        </div>
      </section>

      <section className="table-wrap">
        <h2>Status Peminjaman</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Produk</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Belum ada riwayat peminjaman.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td>#{row.id}</td>
                <td>{row.borrowing_items?.[0]?.item?.name || row.borrowingItems?.[0]?.item?.name || '—'}</td>
                <td>
                  <span className={`pill ${statusClass(row.status)}`}>{row.status}</span>
                </td>
                <td>{row.borrowing_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isAdmin && (
        <section className="admin-panel">
          <div className="admin-head">
            <h2>Tabel Konfirmasi Peminjaman</h2>
            <p className="muted">Klik baris untuk melihat kelengkapan data peminjam, termasuk alasan pinjam.</p>
          </div>
          {actionMessage && <p className="form-success">{actionMessage}</p>}
          <div className="card admin-table-card">
            <table className="data-table admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Peminjam</th>
                  <th>Produk</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      Tidak ada pengajuan yang menunggu konfirmasi.
                    </td>
                  </tr>
                )}
                {pending.map((row) => {
                  const items = row.borrowing_items || row.borrowingItems || []
                  const product = items.map((i) => i.item?.name).filter(Boolean).join(', ')
                  const open = openId === row.id
                  return (
                    <Fragment key={row.id}>
                      <tr
                        className={`clickable ${open ? 'is-open' : ''}`}
                        onClick={() => setOpenId(open ? null : row.id)}
                      >
                        <td>#{row.id}</td>
                        <td>{row.user?.name}</td>
                        <td>{product || '—'}</td>
                        <td>
                          <span className={`pill ${statusClass(row.status)}`}>{row.status}</span>
                        </td>
                        <td>{row.borrowing_date}</td>
                      </tr>
                      {open && (
                        <tr key={`${row.id}-detail`} className="accordion-row">
                          <td colSpan={5}>
                            <div className="accordion">
                              <dl>
                                <div>
                                  <dt>Nama peminjam</dt>
                                  <dd>{row.user?.name}</dd>
                                </div>
                                <div>
                                  <dt>Email</dt>
                                  <dd>{row.user?.email}</dd>
                                </div>
                                <div>
                                  <dt>Kelas</dt>
                                  <dd>{row.user?.class || '—'}</dd>
                                </div>
                                <div>
                                  <dt>Periode</dt>
                                  <dd>
                                    {row.borrowing_date} hingga {row.return_date || '—'}
                                  </dd>
                                </div>
                                <div className="full">
                                  <dt>Alasan Pinjam</dt>
                                  <dd>{row.reason || 'Tidak diisi'}</dd>
                                </div>
                                <div className="full">
                                  <dt>Barang</dt>
                                  <dd>
                                    {items.map((entry) => (
                                      <span key={entry.id} className="chip">
                                        {entry.item?.name} × {entry.quantity}
                                      </span>
                                    ))}
                                  </dd>
                                </div>
                              </dl>
                              <div className="admin-actions">
                                <button type="button" className="btn-primary" onClick={() => act(row.id, 'approve')}>
                                  Setujui
                                </button>
                                <button type="button" className="btn-danger" onClick={() => act(row.id, 'reject')}>
                                  Tolak
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
