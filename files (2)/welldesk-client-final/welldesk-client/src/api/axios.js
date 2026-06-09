import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach JWT to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('wd_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 — token expired, clear and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wd_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
