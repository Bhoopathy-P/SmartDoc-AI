import { useEffect, useState } from 'react'
import { getSessions, deleteSession } from '../api/api'
import { useAuth } from '../contexts/AuthContext'

const TYPE_ICON = { CHAT: '💬', PDF: '📄', DOCX: '📝' }

export default function Sidebar({ activeId, onSelect, onNew, refreshTrigger }) {
  const { token, user, logout, dark, toggleDark } = useAuth()
  const [sessions, setSessions] = useState([])
  const [open, setOpen] = useState(false)   // mobile toggle

  useEffect(() => {
    getSessions(token).then(data => Array.isArray(data) && setSessions(data))
  }, [refreshTrigger, token])

  const remove = async (e, id) => {
    e.stopPropagation()
    await deleteSession(token, id)
    setSessions(s => s.filter(x => x.id !== id))
    if (activeId === id) onNew()
  }

  const fmt = (dt) => {
    const d = new Date(dt)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago'
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago'
    return d.toLocaleDateString()
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button style={S.burger} className="sidebar-burger" onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '☰'}
      </button>

      <aside style={{ ...S.aside, transform: open ? 'translateX(0)' : undefined }} className="sidebar-aside">
        {/* Header */}
        <div style={S.head}>
          <span style={S.brand}>🧠 SmartDoc</span>
          <div style={S.headBtns}>
            <button onClick={toggleDark} style={S.iconBtn}>{dark ? '☀️' : '🌙'}</button>
          </div>
        </div>

        {/* New chat button */}
        <button style={S.newBtn} onClick={() => { onNew(); setOpen(false) }}>
          ✚ New Chat
        </button>

        {/* Session list */}
        <div style={S.listWrap}>
          {sessions.length === 0 && (
            <p style={S.empty}>No chats yet. Start a new one!</p>
          )}
          {sessions.map(s => (
            <div key={s.id} style={S.item(s.id === activeId)}
              onClick={() => { onSelect(s.id); setOpen(false) }}>
              <span style={S.typeIcon}>{TYPE_ICON[s.fileType] || '💬'}</span>
              <div style={S.itemBody}>
                <div style={S.itemTitle}>{s.title}</div>
                <div style={S.itemTime}>{fmt(s.updatedAt)}</div>
              </div>
              <button style={S.delBtn} onClick={e => remove(e, s.id)} title="Delete">✕</button>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div style={S.footer}>
          <div style={S.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={S.userInfo}>
            <div style={S.userName}>{user?.name}</div>
            <div style={S.userEmail}>{user?.email}</div>
          </div>
          <button style={S.logoutBtn} onClick={logout} title="Logout">⇠</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div style={S.overlay} onClick={() => setOpen(false)} />}
    </>
  )
}

const S = {
  aside: {
    width: 'var(--sidebar-w, 260px)', minWidth: 260,
    background: 'var(--surface)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', height: '100vh',
    position: 'fixed', top: 0, left: 0, zIndex: 100,
    transition: 'transform 0.25s'
    // Responsive: translateX(-100%) on mobile handled by .sidebar-aside CSS class
  },
  burger: {
    display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 200,
    background: 'var(--primary)', color: '#fff', border: 'none',
    borderRadius: 8, padding: '6px 12px', fontSize: 18
    // Responsive: display:block on mobile handled by .sidebar-burger CSS class
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99
  },
  head: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 16px 8px', borderBottom: '1px solid var(--border)'
  },
  brand: { fontWeight: 800, fontSize: 18, color: 'var(--primary)' },
  headBtns: { display: 'flex', gap: 4 },
  iconBtn: {
    background: 'none', border: 'none', fontSize: 18,
    padding: 4, borderRadius: 6
  },
  newBtn: {
    margin: '12px 12px 8px', padding: '10px 16px',
    background: 'var(--primary)', color: '#fff', border: 'none',
    borderRadius: 10, fontWeight: 600, fontSize: 14, textAlign: 'left'
  },
  listWrap: { flex: 1, overflowY: 'auto', padding: '4px 8px' },
  empty: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' },
  item: (active) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px',
    borderRadius: 8, cursor: 'pointer', marginBottom: 2,
    background: active ? 'var(--primary-light)' : 'transparent',
    transition: 'background 0.15s'
  }),
  typeIcon: { fontSize: 16, flexShrink: 0 },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: {
    fontSize: 13, fontWeight: 500, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  itemTime: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  delBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: 12, padding: '2px 4px', borderRadius: 4, opacity: 0.6
  },
  footer: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderTop: '1px solid var(--border)'
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15, flexShrink: 0
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontWeight: 600, fontSize: 13, color: 'var(--text)' },
  userEmail: {
    fontSize: 11, color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  logoutBtn: {
    background: 'none', border: 'none', fontSize: 20,
    color: 'var(--text-muted)', padding: 4
  }
}
