import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import ProtectedRoute from './components/common/ProtectedRoute'
import AppLayout from './components/common/AppLayout'

import Login from './pages/Login'
import Register from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import Checkins from './pages/Checkins'
import Goals from './pages/Goals'
import Team from './pages/Team'
import Profile from './pages/Profile'

// Redirects to the right dashboard based on role
function DashboardRedirect() {
  const { isOwner } = useAuth()
  return isOwner ? <Dashboard /> : <EmployeeDashboard />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardRedirect />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/checkins" element={
              <ProtectedRoute>
                <AppLayout>
                  <Checkins />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/goals" element={
              <ProtectedRoute>
                <AppLayout>
                  <Goals />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/team" element={
              <ProtectedRoute ownerOnly>
                <AppLayout>
                  <Team />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
