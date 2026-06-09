import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('wd_token') || null)
  const [loading, setLoading] = useState(true)

  // On mount, if token exists, fetch current user
  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get('/users/me')
      .then(res => setUser(res.data))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const login = (tokenValue, userData) => {
    localStorage.setItem('wd_token', tokenValue)
    setToken(tokenValue)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('wd_token')
    setToken(null)
    setUser(null)
  }

  const isOwner    = user?.role === 'owner'
  const isEmployee = user?.role === 'employee'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isOwner, isEmployee }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
