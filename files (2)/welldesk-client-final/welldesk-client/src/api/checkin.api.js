import api from './axios'

export const getCheckins    = (params) => api.get('/checkins', { params })
export const getCheckin     = (id)     => api.get(`/checkins/${id}`)
export const createCheckin  = (data)   => api.post('/checkins', data)  // data = FormData
export const updateCheckin  = (id, data) => api.put(`/checkins/${id}`, data)
export const deleteCheckin  = (id)     => api.delete(`/checkins/${id}`)
