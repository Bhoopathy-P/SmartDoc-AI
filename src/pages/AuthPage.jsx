import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loginUser, registerUser } from '../api/api'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, dark, toggleDark } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = mode === 'login'
        ? await loginUser(form.email, form.password)
        : await registerUser(form.name, form.email, form.password)
      if (data.error) { setError(data.error); return }
      login(data)
      navigate('/app')
    } catch {
      setError('Network error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <button onClick={toggleDark} style={S.darkBtn} title="Toggle dark mode">
        {dark ? '☀️' : '🌙'}
      </button>
      <div style={S.card}>
        <div style={S.logo}>🧠</div>
        <h1 style={S.title}>SmartDoc</h1>
        <p style={S.sub}>AI Chat + Document Assistant</p>

        <div style={S.tabs}>
          {['login','register'].map(m => (
            <button key={m} style={S.tab(mode===m)} onClick={() => { setMode(m); setError('') }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={S.form}>
          {mode === 'register' && (
            <input name="name" placeholder="Full name" value={form.name}
              onChange={handle} style={S.input} required />
          )}
          <input name="email" type="email" placeholder="Email address" value={form.email}
            onChange={handle} style={S.input} required />
          <input name="password" type="password" placeholder="Password (min 6 chars)" value={form.password}
            onChange={handle} style={S.input} required minLength={6} />
          {error && <div style={S.error}>{error}</div>}
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  )
}

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'var(--bg)', padding: 16
  },
  darkBtn: {
    position: 'fixed', top: 16, right: 16, background: 'var(--surface)',
    border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 12px',
    fontSize: 18, color: 'var(--text)'
  },
  card: {
    background: 'var(--surface)', borderRadius: 20, padding: '40px 36px',
    boxShadow: 'var(--shadow)', width: '100%', maxWidth: 420, textAlign: 'center'
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  sub: { color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: (active) => ({
    flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
    fontWeight: 600, fontSize: 14,
    background: active ? 'var(--primary)' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all 0.2s'
  }),
  form: { display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' },
  input: { width: '100%', padding: '12px 14px', fontSize: 14 },
  error: {
    background: 'var(--red-bg)', color: 'var(--red)',
    padding: '10px 14px', borderRadius: 8, fontSize: 13
  },
  btn: {
    padding: '13px', background: 'var(--primary)', color: '#fff',
    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15,
    marginTop: 4, transition: 'background 0.2s'
  }
}
