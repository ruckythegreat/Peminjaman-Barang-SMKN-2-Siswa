import { Link, useNavigate } from 'react-router-dom'
import { mediaUrl } from '../api/media'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U'
  const photo = mediaUrl(user?.profile_image)

  return (
    <header className="navbar">
      <Link to={user ? '/lobby' : '/'} className="brand">
        Peminjaman BarangKy
      </Link>
      {user && (
        <button
          type="button"
          className="avatar-btn"
          aria-label="Buka profil"
          onClick={() => navigate('/dashboard')}
        >
          {photo ? <img src={photo} alt={user.name} /> : <span>{initial}</span>}
        </button>
      )}
    </header>
  )
}
