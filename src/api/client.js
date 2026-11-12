import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL?.trim()
  || `${window.location.protocol}//${window.location.hostname}:8000`

const client = axios.create({
  baseURL: `${apiUrl.replace(/\/$/, '')}/api/v1`,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// 1. Automatically attach the token to outgoing requests
client.interceptors.request.use(
  config => {
    if (config.data instanceof FormData) {
      // Let the browser set the multipart boundary.
      delete config.headers['Content-Type']
    }
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 2. Handle expired or invalid tokens (401)
let isRedirecting = false

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      alert('Your session has expired. Please sign in again.')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
