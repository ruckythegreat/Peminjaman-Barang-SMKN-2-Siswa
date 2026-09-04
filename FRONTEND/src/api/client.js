import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('barangky_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  } else if (config.data && typeof config.data === 'object' && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('barangky_token')
      localStorage.removeItem('barangky_user')
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.location.assign('/')
      }
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(err, fallback = 'Permintaan gagal.') {
  const data = err.response?.data
  const firstValidation = data?.errors ? Object.values(data.errors)[0]?.[0] : null
  return firstValidation || data?.message || fallback
}

export default api
