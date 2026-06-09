import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { registerOwner, registerEmployee } from '../api/auth.api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const isEmployee = !!inviteToken

  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiErr, setApiErr] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!isEmployee && !form.companyName.trim()) e.companyName = 'Company name is required'
    if (!form.name.trim())    e.name     = 'Your name is required'
    if (!form.email)          e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)       e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setLoading(true); setApiErr('')
    try {
      const payload = isEmployee
        ? { name: form.name, email: form.email, password: form.password, inviteToken }
        : { companyName: form.companyName, name: form.name, email: form.email, password: form.password }

      const res = isEmployee
        ? await registerEmployee(payload)
        : await registerOwner(payload)

      login(res.data.token, res.data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Registration failed.')
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
          <p>{isEmployee ? 'Join your team' : 'Create your company account'}</p>
        </div>

        {apiErr && <div className="alert alert-error">⚠️ {apiErr}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {!isEmployee && (
            <div className="form-group">
              <label className="form-label">Company name</label>
              <input
                type="text"
                className={`form-input ${errors.companyName ? 'error' : ''}`}
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={set('companyName')}
              />
              {errors.companyName && <p className="form-error">{errors.companyName}</p>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Your full name</label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Jane Smith"
              value={form.name}
              onChange={set('name')}
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
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
            <label className="form-label">Confirm password</label>
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
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
