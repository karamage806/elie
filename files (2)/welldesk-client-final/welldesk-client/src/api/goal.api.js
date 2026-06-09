import api from './axios'

export const getGoals      = (params)     => api.get('/goals', { params })
export const getGoal       = (id)         => api.get(`/goals/${id}`)
export const createGoal    = (data)       => api.post('/goals', data)
export const updateGoal    = (id, data)   => api.put(`/goals/${id}`, data)
export const deleteGoal    = (id)         => api.delete(`/goals/${id}`)
export const getProgress   = (id)         => api.get(`/goals/${id}/progress`)
export const logProgress   = (id, data)   => api.post(`/goals/${id}/progress`, data)
