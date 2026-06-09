const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export default function Avatar({ name = '', src, size = 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const imgSrc = src?.startsWith('http') ? src : src ? `${API_URL}${src}` : null

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={name}
        className={`avatar avatar-${size}`}
        onError={e => { e.target.style.display = 'none' }}
      />
    )
  }

  return (
    <div className={`avatar avatar-${size}`}>
      {initials || '?'}
    </div>
  )
}
