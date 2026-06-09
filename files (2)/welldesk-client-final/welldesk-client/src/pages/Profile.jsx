import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateUser, uploadAvatar } from '../api/user.api'
import Avatar from '../components/common/Avatar'

export default function Profile() {
  const { user, login } = useAuth()
  const token = localStorage.getItem('wd_token')

  const [form, setForm]       = useState({ name: user?.name || '', email: user?.email || '' })
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState('')
  const [apiErr, setApiErr]   = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    return e
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setSaving(true); setApiErr(''); setSuccess('')
    try {
      const res = await updateUser(user.id, form)
      login(token, { ...user, ...res.data })
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    const fd = new FormData()
    fd.append('avatar', avatarFile)
    setUploadingAvatar(true)
    try {
      const res = await uploadAvatar(user.id, fd)
      login(token, { ...user, avatar_url: res.data.avatar_url })
      setAvatarPreview(null)
      setAvatarFile(null)
      setSuccess('Avatar updated.')
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Avatar upload failed.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrors(p => ({ ...p, [f]: '' }))
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account details</p>
        </div>
      </div>

      {/* Avatar section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Profile photo</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Avatar
            name={user?.name}
            src={avatarPreview || user?.avatar_url}
            size="xl"
          />
          <div>
            <input
              type="file"
              id="avatar-input"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              Choose photo
            </label>
            {avatarFile && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: '10px' }}
                onClick={handleAvatarUpload}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? <><span className="spinner" /> Uploading…</> : 'Upload'}
              </button>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              JPG, PNG or WebP. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Info form */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Account details</h3>

        {success && <div className="alert alert-success">✅ {success}</div>}
        {apiErr  && <div className="alert alert-error">⚠️ {apiErr}</div>}

        <form onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
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
              value={form.email}
              onChange={set('email')}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <input type="text" className="form-input" value={user?.role} disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
