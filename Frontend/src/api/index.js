import axios from 'axios'

// Use proxy in development, direct URL in production
const baseURL = import.meta.env.DEV ? '/api' : 'http://localhost:5000'

const api = axios.create({ baseURL })

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Authentication
export const signup = (userData) => api.post('/auth/signup', userData)
export const login = (email, password) => api.post('/auth/login', { email, password })
export const verifyToken = () => api.get('/auth/verify')
export const getCurrentUser = () => api.get('/auth/me')

// Sessions
export const getSessions      = ()    => api.get('/sessions')
export const getSession       = (id)  => api.get(`/sessions/${id}`)
export const getSessionLogs   = (id)  => api.get(`/sessions/${id}/logs`)
export const getOperatorStats = ()    => api.get('/stats/operators')
export const getVideoUrl      = (id, speed = 1)  => `${baseURL}/sessions/${id}/video/stream?speed=${speed}`
export const getUploadUrl     = (id, speed = 1)  => `${baseURL}/sessions/${id}/upload/stream?speed=${speed}`
export const uploadVideo      = (file) => {
  const form = new FormData()
  form.append('video', file)
  return api.post('/upload', form)
}
export const downloadChallan  = (id)  => api.post(`/sessions/${id}/challan`, {}, { responseType: 'blob' })
export const deleteSession    = (id)  => api.delete(`/sessions/${id}`)

export const WS_URL = 'ws://localhost:5000/ws/stream'
