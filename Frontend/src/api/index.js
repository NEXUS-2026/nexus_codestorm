import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5000' })

export const getSessions      = ()    => api.get('/sessions')
export const getSession       = (id)  => api.get(`/sessions/${id}`)
export const getSessionLogs   = (id)  => api.get(`/sessions/${id}/logs`)
export const getOperatorStats = ()    => api.get('/stats/operators')
export const getVideoUrl      = (id)  => `http://localhost:5000/sessions/${id}/video`
export const getUploadUrl     = (id)  => `http://localhost:5000/sessions/${id}/upload`
export const uploadVideo      = (file) => {
  const form = new FormData()
  form.append('video', file)
  return api.post('/upload', form)
}
// challan generation will be added after YOLO model is integrated

export const WS_URL = 'ws://localhost:5000/ws/stream'
