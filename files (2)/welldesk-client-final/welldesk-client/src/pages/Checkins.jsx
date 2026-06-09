import { useState, useEffect } from 'react'
import { getCheckins, createCheckin, updateCheckin, deleteCheckin } from '../api/checkin.api'
import { useAuth } from '../context/AuthContext'
import { exportCheckinsCSV } from '../utils/exportCSV'

const moodEmoji = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' }
const moodColor = { 1: 'badge-red', 2: 'badge-red', 3: 'badge-yellow', 4: 'badge-green', 5: 'badge-green' }

function CheckinForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { mood_score: 3, energy_score: 3, notes: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState('')

  const validate = () => {
    const e = {}
    if (!form.mood_score)   e.mood_score   = 'Mood is required'
    if (!form.energy_score) e.energy_score = 'Energy is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setLoading(true); setApiErr('')
    try {
      let res
      if (initial?.id) {
        res = await updateCheckin(initial.id, form)
      } else {
        const fd = new FormData()
        fd.append('mood_score', form.mood_score)
        fd.append('energy_score', form.energy_score)
        if (form.notes) fd.append('notes', form.notes)
        if (form.sick_note) fd.append('sick_note', form.sick_note)
        res = await createCheckin(fd)
      }
      onSave(res.data)
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Failed to save check-in.')
    } finally {
      setLoading(false)
    }
  }

  const ScoreSelector = ({ field, label }) => (
    <div className="form-group">
      <label className="form-label">{label}: {form[field]}/5</label>
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n} type="button"
            onClick={() => setForm(p => ({ ...p, [field]: n }))}
            style={{
              width: '40px', height: '40px', borderRadius: '8px',
              border: `2px solid ${form[field] === n ? 'var(--primary)' : 'var(--border)'}`,
              background: form[field] === n ? 'var(--primary-lt)' : 'var(--bg-card)',
              color: form[field] === n ? 'var(--primary)' : 'var(--text)',
              fontWeight: 600, cursor: 'pointer', fontSize: '15px',
            }}
          >
            {moodEmoji[n]}
          </button>
        ))}
      </div>
      {errors[field] && <p className="form-error">{errors[field]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      {apiErr && <div className="alert alert-error">⚠️ {apiErr}</div>}
      <ScoreSelector field="mood_score" label="How are you feeling?" />
      <ScoreSelector field="energy_score" label="Energy level?" />
      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Anything on your mind today?"
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
        />
      </div>
      {!initial?.id && (
        <div className="form-group">
          <label className="form-label">Sick note (PDF, optional)</label>
          <input
            type="file" accept=".pdf"
            className="form-input"
            onChange={e => setForm(p => ({ ...p, sick_note: e.target.files[0] }))}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : 'Save Check-in'}
        </button>
      </div>
    </form>
  )
}

export default function Checkins() {
  const { isOwner } = useAuth()
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Filters
  const [search, setSearch]     = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const [moodMin, setMoodMin]   = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (fromDate) params.from = fromDate
    if (toDate)   params.to   = toDate
    if (moodMin)  params.mood_min = moodMin
    getCheckins(params)
      .then(res => setCheckins(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [fromDate, toDate, moodMin]) // eslint-disable-line

  const filtered = checkins.filter(c => {
    if (!search) return true
    const name = c.user_name || ''
    const notes = c.notes || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
           notes.toLowerCase().includes(search.toLowerCase())
  })

  const handleSave = (saved) => {
    if (editing) {
      setCheckins(prev => prev.map(c => c.id === saved.id ? saved : c))
      setEditing(null)
    } else {
      setCheckins(prev => [saved, ...prev])
      setShowForm(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCheckin(id)
      setCheckins(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Check-ins</h1>
          <p className="page-subtitle">{isOwner ? 'All team check-ins' : 'Your daily wellness log'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportCheckinsCSV(filtered)}
          >
            📤 Export CSV
          </button>
          {!isOwner && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Check in today
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>Today's Check-in</h3>
          <CheckinForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="search-bar" style={{ maxWidth: '240px' }}>
            <span className="icon">🔍</span>
            <input
              placeholder={isOwner ? 'Search by name or notes…' : 'Search notes…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>From</label>
            <input type="date" className="form-input" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding: '7px 10px' }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>To</label>
            <input type="date" className="form-input" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding: '7px 10px' }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Min mood</label>
            <select className="form-select" value={moodMin} onChange={e => setMoodMin(e.target.value)} style={{ padding: '7px 10px' }}>
              <option value="">Any</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {moodEmoji[n]}</option>)}
            </select>
          </div>
          {(fromDate || toDate || moodMin) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFromDate(''); setToDate(''); setMoodMin('') }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No check-ins found</h3>
            <p>{search || fromDate || toDate || moodMin ? 'Try adjusting your filters.' : 'No check-ins yet.'}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {isOwner && <th>Employee</th>}
                    <th>Date</th>
                    <th>Mood</th>
                    <th>Energy</th>
                    <th>Notes</th>
                    <th>Sick note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      {isOwner && (
                        <td style={{ fontWeight: 500 }}>{c.user_name}</td>
                      )}
                      <td>{new Date(c.checkin_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${moodColor[c.mood_score]}`}>
                          {moodEmoji[c.mood_score]} {c.mood_score}/5
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${moodColor[c.energy_score]}`}>
                          ⚡ {c.energy_score}/5
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {c.notes || '—'}
                      </td>
                      <td>
                        {c.sick_note_url
                          ? <a href={c.sick_note_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px' }}>📄 View</a>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(!isOwner) && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>Edit</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleting(c.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Edit Check-in</h3>
              <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            </div>
            <CheckinForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Delete Check-in?</h3>
              <button className="modal-close" onClick={() => setDeleting(null)}>×</button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              This action cannot be undone.
            </p>
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
