import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api/goal.api'
import { useAuth } from '../context/AuthContext'

const statusBadge = { active: 'badge-blue', completed: 'badge-green', archived: 'badge-purple' }

function GoalForm({ initial, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(initial || {
    title: '', description: '', target_value: '', metric: 'avg_mood',
    start_date: today, end_date: '', status: 'active',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState('')

  const validate = () => {
    const e = {}
    if (!form.title.trim())   e.title        = 'Title is required'
    if (!form.target_value)   e.target_value = 'Target value is required'
    if (!form.start_date)     e.start_date   = 'Start date is required'
    if (!form.end_date)       e.end_date     = 'End date is required'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true); setApiErr('')
    try {
      const res = initial?.id
        ? await updateGoal(initial.id, form)
        : await createGoal(form)
      onSave(res.data)
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Failed to save goal.')
    } finally {
      setLoading(false)
    }
  }

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  return (
    <form onSubmit={handleSubmit}>
      {apiErr && <div className="alert alert-error">⚠️ {apiErr}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Goal title</label>
          <input type="text" className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="e.g. Team avg mood above 4 this month"
            value={form.title} onChange={set('title')} />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description (optional)</label>
          <textarea className="form-textarea" placeholder="Additional context…"
            value={form.description} onChange={set('description')} />
        </div>
        <div className="form-group">
          <label className="form-label">Metric</label>
          <select className="form-select" value={form.metric} onChange={set('metric')}>
            <option value="avg_mood">Average Mood</option>
            <option value="checkin_rate">Check-in Rate (%)</option>
            <option value="avg_energy">Average Energy</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Target value</label>
          <input type="number" step="0.1" min="0" className={`form-input ${errors.target_value ? 'error' : ''}`}
            placeholder="e.g. 4" value={form.target_value} onChange={set('target_value')} />
          {errors.target_value && <p className="form-error">{errors.target_value}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Start date</label>
          <input type="date" className={`form-input ${errors.start_date ? 'error' : ''}`}
            value={form.start_date} onChange={set('start_date')} />
          {errors.start_date && <p className="form-error">{errors.start_date}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <input type="date" className={`form-input ${errors.end_date ? 'error' : ''}`}
            value={form.end_date} onChange={set('end_date')} />
          {errors.end_date && <p className="form-error">{errors.end_date}</p>}
        </div>
        {initial?.id && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : 'Save Goal'}
        </button>
      </div>
    </form>
  )
}

export default function Goals() {
  const { isOwner } = useAuth()
  const [goals, setGoals]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter]    = useState('active')

  useEffect(() => {
    setLoading(true)
    getGoals(filter ? { status: filter } : {})
      .then(res => setGoals(res.data))
      .finally(() => setLoading(false))
  }, [filter])

  const handleSave = (saved) => {
    if (editing) {
      setGoals(prev => prev.map(g => g.id === saved.id ? saved : g))
      setEditing(null)
    } else {
      setGoals(prev => [saved, ...prev])
      setShowForm(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  // Mock progress % — in real app this would come from goal_progress table
  const mockProgress = (g) => Math.min(100, Math.round(Math.random() * 80 + 10))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Wellness Goals</h1>
          <p className="page-subtitle">Track team wellness targets</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Goal
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['active', 'completed', 'archived', ''].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>New Goal</h3>
          <GoalForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Goals list */}
      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No goals yet</h3>
          <p>{isOwner ? 'Create a wellness goal for your team.' : 'No goals have been set yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {goals.map(g => {
            const pct = mockProgress(g)
            return (
              <div key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{g.title}</h3>
                      <span className={`badge ${statusBadge[g.status]}`}>{g.status}</span>
                    </div>
                    {g.description && (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{g.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span>📏 Target: <strong style={{ color: 'var(--text)' }}>{g.target_value} ({g.metric})</strong></span>
                      <span>📅 {new Date(g.start_date).toLocaleDateString()} → {new Date(g.end_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Progress</span><span>{pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--primary)' }} />
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(g)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleting(g.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Goal</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            </div>
            <GoalForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Delete Goal?</h3>
              <button className="modal-close" onClick={() => setDeleting(null)}>×</button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>This action cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleting)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
