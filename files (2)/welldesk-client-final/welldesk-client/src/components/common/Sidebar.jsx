import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'
import { useState } from 'react'

const ownerLinks = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { to: '/checkins',   label: 'Check-ins',  icon: '✅' },
  { to: '/goals',      label: 'Goals',      icon: '🎯' },
  { to: '/team',       label: 'Team',       icon: '👥' },
  { to: '/profile',    label: 'Profile',    icon: '👤' },
]

const employeeLinks = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { to: '/checkins',   label: 'My Check-ins', icon: '✅' },
  { to: '/goals',      label: 'Goals',      icon: '🎯' },
  { to: '/profile',    label: 'Profile',    icon: '👤' },
]

export default function Sidebar() {
  const { user, logout, isOwner } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = isOwner ? ownerLinks : employeeLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg-sidebar)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      top: 0, left: 0,
      zIndex: 100,
      transition: 'transform 0.2s',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          💚 WellDesk
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '2px' }}>
          {user?.company_name || 'Wellness Tracker'}
        </p>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '4px',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Avatar name={user?.name} src={user?.avatar_url} size="sm" />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ display: 'block' }}>
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '14px', left: '14px',
          zIndex: 200,
          background: 'var(--primary)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '18px',
          color: '#fff',
          cursor: 'pointer',
        }}
        className="hamburger"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: block !important; transform: translateX(${mobileOpen ? '0' : '-100%'}); }
          .hamburger { display: block !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </>
  )
}
