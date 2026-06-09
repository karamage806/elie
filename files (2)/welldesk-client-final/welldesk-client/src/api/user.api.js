import api from './axios'

export const getMe         = ()           => api.get('/users/me')
export const getTeam       = (params)     => api.get('/users', { params })
export const updateUser    = (id, data)   => api.patch(`/users/${id}`, data)
export const uploadAvatar  = (id, form)   => api.patch(`/users/${id}/avatar`, form)
export const deleteUser    = (id)         => api.delete(`/users/${id}`)
