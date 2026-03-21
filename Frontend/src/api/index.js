import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5000' })

export const getSessions      = ()    => api.get('/sessions')
export const getSession       = (id)  => api.get(`/sessions/${id}`)
export const getSessionLogs   = (id)  => api.get(`/sessions/${id}/logs`)
export const getOperatorStats = ()    => api.get('/stats/operators')
export const getVideoUrl      = (id, speed = 1)  => `http://localhost:5000/sessions/${id}/video/stream?speed=${speed}`
export const getUploadUrl     = (id, speed = 1)  => `http://localhost:5000/sessions/${id}/upload/stream?speed=${speed}`
export const uploadVideo      = (file) => {
  const form = new FormData()
  form.append('video', file)
  return api.post('/upload', form)
}
export const downloadChallan  = (id)  => api.post(`/sessions/${id}/challan`, {}, { responseType: 'blob' })
export const deleteSession    = (id)  => api.delete(`/sessions/${id}`)

export const WS_URL = 'ws://localhost:5000/ws/stream'
