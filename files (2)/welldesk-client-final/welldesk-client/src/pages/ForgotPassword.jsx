import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth.api'

export function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }

    setLoading(true); setError('')
    try {
      await forgotPassword({ email })
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💚 WellDesk</h1>
          <p>Reset your password</p>
        </div>

        {success ? (
          <div>
            <div className="alert alert-success">
              ✅ If that email exists, we've sent a reset link. Check your inbox.
            </div>
            <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="spinner" /> Sending…</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">← Back to login</Link>
        </div>
      </div>
    </div>
  )
}
