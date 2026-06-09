import { useState, useEffect } from 'react'
import { getEmployeeStats } from '../api/dashboard.api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getEmployeeStats()
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load your dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>
  if (error)   return <div className="alert alert-error">{error}</div>

  const { mood_trend, streak, avg_mood, avg_energy, total_checkins } = data

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Your personal wellness overview</p>
        </div>
        <Link to="/checkins" className="btn btn-primary">+ Check in today</Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>🔥</div>
          <div>
            <div className="stat-value">{streak}</div>
            <div className="stat-label">Day streak</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}>📊</div>
          <div>
            <div className="stat-value">{total_checkins || 0}</div>
            <div className="stat-label">Check-ins (30 days)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}>💚</div>
          <div>
            <div className="stat-value">{avg_mood || '—'}</div>
            <div className="stat-label">Avg mood (30 days)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fdf4ff' }}>⚡</div>
          <div>
            <div className="stat-value">{avg_energy || '—'}</div>
            <div className="stat-label">Avg energy (30 days)</div>
          </div>
        </div>
      </div>

      {/* Mood chart */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Your Mood & Energy (last 30 days)</h3>
        {mood_trend.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No check-ins yet</h3>
            <p>Start checking in daily to see your trends here.</p>
            <Link to="/checkins" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
              Check in now
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mood_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={d => `Date: ${d}`} />
              <Legend />
              <Line type="monotone" dataKey="mood_score"   stroke="#534AB7" strokeWidth={2} dot={{ r: 3 }} name="Mood" />
              <Line type="monotone" dataKey="energy_score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Energy" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
