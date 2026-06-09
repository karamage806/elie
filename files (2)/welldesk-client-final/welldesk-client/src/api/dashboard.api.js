import api from './axios'

export const getDashboardStats  = () => api.get('/dashboard/stats')
export const getEmployeeStats   = () => api.get('/dashboard/employee')
export const getCompany         = () => api.get('/company')
export const validateInvite     = (token) => api.get(`/company/invite/${token}`)
