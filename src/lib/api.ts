import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {
      // malformed storage — ignore
    }
  }
  return config
})

// Handle 401 / 403 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/')
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }

    if (status === 403 && code === 'TRIAL_EXPIRED') {
      window.location.href = '/app/upgrade?reason=trial_expired'
    }

    return Promise.reject(error)
  }
)

export default api
