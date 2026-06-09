import { useState, useEffect } from 'react'
import { getTeam, deleteUser } from '../api/user.api'
import { getCompany } from '../api/dashboard.api'
import Avatar from '../components/common/Avatar'

const moodBadge = (avg) => {
  if (!avg) return { cls: 'badge-purple', label: 'No data' }
  if (avg >= 4) return { cls: 'badge-green',  label: `😄 ${avg}` }
  if (avg >= 3) return { cls: 'badge-yellow', label: `😐 ${avg}` }
  return           { cls: 'badge-red',    label: `😟 ${avg}` }
}

export default function Team() {
  const [team, setTeam]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [deleting, setDeleting] = useState(null)
  const [company, setCompany]   = useState(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    Promise.all([getTeam(), getCompany()])
      .then(([teamRes, compRes]) => {
        setTeam(teamRes.data)
        setCompany(compRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = team.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      setTeam(prev => prev.filter(u => u.id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=${company.invite_token}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{team.length} member{team.length !== 1 ? 's' : ''}</p>
        </div>
        {company && (
          <button className="btn btn-secondary" onClick={copyInviteLink}>
            {copied ? '✅ Copied!' : '🔗 Copy invite link'}
          </button>
        )}
      </div>

      {/* Invite info */}
      {company && (
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          Share the invite link with new employees so they can join <strong>{company.name}</strong>.
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div className="search-bar" style={{ maxWidth: '300px' }}>
          <span className="icon">🔍</span>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Team table */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No team members found</h3>
            <p>Share the invite link to add employees.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Avg mood (30d)</th>
                  <th>Last check-in</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const mood = moodBadge(u.avg_mood)
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={u.name} src={u.avatar_url} size="sm" />
                          <div>
                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'owner' ? 'badge-purple' : 'badge-blue'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td><span className={`badge ${mood.cls}`}>{mood.label}</span></td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {u.last_checkin ? new Date(u.last_checkin).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {u.role !== 'owner' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleting(u)}>
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleting && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Remove {deleting.name}?</h3>
              <button className="modal-close" onClick={() => setDeleting(null)}>×</button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              This will remove them from your team and delete all their data.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleting.id)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
