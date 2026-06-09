import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/auth.api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [form, setForm]     = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    if (!token) { setApiErr('Invalid reset link.'); return }

    setLoading(true); setApiErr('')
    try {
      await resetPassword({ token, password: form.password })
      navigate('/login', { state: { message: 'Password reset! Please sign in.' } })
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Reset failed. Try requesting a new link.')
    } finally {
      setLoading(false)
    }
  }

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💚 WellDesk</h1>
          <p>Set a new password</p>
        </div>

        {apiErr && <div className="alert alert-error">⚠️ {apiErr}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={set('password')}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input
              type="password"
              className={`form-input ${errors.confirm ? 'error' : ''}`}
              placeholder="••••••••"
              value={form.confirm}
              onChange={set('confirm')}
            />
            {errors.confirm && <p className="form-error">{errors.confirm}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Resetting…</> : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>
    </div>
  )
}
