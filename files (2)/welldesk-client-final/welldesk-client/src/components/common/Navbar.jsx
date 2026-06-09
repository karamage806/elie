import ThemeToggle from './ThemeToggle'

export default function Navbar({ title }) {
  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
        {title}
      </h2>
      <ThemeToggle />
    </header>
  )
}
