import { useState, useEffect } from 'react'
import { getDashboardStats } from '../api/dashboard.api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Avatar from '../components/common/Avatar'

const moodLabel = (score) => {
  const map = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' }
  return map[Math.round(score)] || '—'
}

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>
  if (error)   return <div className="alert alert-error">{error}</div>

  const { stats, mood_trend, checkin_rate, flagged_employees, not_checked_in_today } = data

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Dashboard</h1>
          <p className="page-subtitle">Overview of your team's wellness today</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}>👥</div>
          <div>
            <div className="stat-value">{stats.total_employees}</div>
            <div className="stat-label">Total employees</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}>✅</div>
          <div>
            <div className="stat-value">{stats.checked_in_today}</div>
            <div className="stat-label">Checked in today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>💛</div>
          <div>
            <div className="stat-value">{stats.avg_mood_week || '—'} {stats.avg_mood_week ? moodLabel(stats.avg_mood_week) : ''}</div>
            <div className="stat-label">Avg mood this week</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2' }}>🚨</div>
          <div>
            <div className="stat-value" style={{ color: stats.flagged_count > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {stats.flagged_count}
            </div>
            <div className="stat-label">Flagged (low mood)</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Mood trend */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Team Mood Trend (30 days)</h3>
          {mood_trend.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>No check-in data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mood_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={d => `Date: ${d}`}
                  formatter={(v, n) => [v, n === 'avg_mood' ? 'Mood' : 'Energy']}
                />
                <Legend />
                <Line type="monotone" dataKey="avg_mood"   stroke="#534AB7" strokeWidth={2} dot={false} name="Mood" />
                <Line type="monotone" dataKey="avg_energy" stroke="#10b981" strokeWidth={2} dot={false} name="Energy" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Check-in rate */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Check-ins This Week (per person)</h3>
          {checkin_rate.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}><p>No data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={checkin_rate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" domain={[0, 7]} ticks={[0,1,2,3,4,5,6,7]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={v => [v, 'Check-ins']} />
                <Bar dataKey="checkins_count" fill="#534AB7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Not checked in */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
            ⏰ Not Checked In Today ({not_checked_in_today.length})
          </h3>
          {not_checked_in_today.length === 0 ? (
            <div className="alert alert-success">🎉 Everyone has checked in today!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {not_checked_in_today.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={u.name} src={u.avatar_url} size="sm" />
                  <span style={{ fontSize: '14px' }}>{u.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flagged */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
            🚨 Flagged Employees (avg mood ≤ 2)
          </h3>
          {flagged_employees.length === 0 ? (
            <div className="alert alert-success">✅ No employees flagged. Team is doing well!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {flagged_employees.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fef2f2', borderRadius: '8px' }}>
                  <Avatar name={u.name} src={u.avatar_url} size="sm" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--danger)' }}>Avg mood: {u.avg_mood}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-charts, .dashboard-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
