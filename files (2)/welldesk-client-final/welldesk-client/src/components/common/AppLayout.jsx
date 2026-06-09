import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/checkins':  'Check-ins',
  '/goals':     'Wellness Goals',
  '/team':      'Team',
  '/profile':   'Profile',
}

export default function AppLayout({ children }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'WellDesk'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title={title} />
        <div className="page-wrapper">
          {children}
        </div>
      </div>
    </div>
  )
}
