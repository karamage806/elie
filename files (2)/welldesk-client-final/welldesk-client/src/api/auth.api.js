import api from './axios'

export const registerOwner   = (data) => api.post('/auth/register', data)
export const registerEmployee = (data) => api.post('/auth/register-employee', data)
export const login           = (data) => api.post('/auth/login', data)
export const forgotPassword  = (data) => api.post('/auth/forgot-password', data)
export const resetPassword   = (data) => api.post('/auth/reset-password', data)
