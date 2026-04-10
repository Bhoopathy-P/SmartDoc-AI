import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { sendChat, sendFilePdf, sendFileDocx, getSessionMessages } from '../api/api'

const TABS = ['💬 Chat', '📄 PDF', '📝 DOCX']
const ACCEPTS = { '📄 PDF': '.pdf', '📝 DOCX': '.docx' }

export default function ChatWindow({ sessionId, onNewSession }) {
  const { token } = useAuth()
  const [tab, setTab] = useState('💬 Chat')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [curSession, setCurSession] = useState(sessionId)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)

  // Load messages when session changes
  useEffect(() => {
    setCurSession(sessionId)
    if (sessionId) {
      getSessionMessages(token, sessionId).then(data => {
        if (Array.isArray(data)) {
          setMessages(data.map(m => ({ role: m.role, text: m.content })))
        }
      })
    } else {
      setMessages([])
    }
    setFile(null); setQuestion(''); setInput('')
  }, [sessionId, token])

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages])

  const addMsg = (role, text) => setMessages(m => [...m, { role, text }])

  const sendChatMsg = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput(''); addMsg('user', msg); setLoading(true)
    try {
      const data = await sendChat(token, msg, curSession)
      if (data.error) { addMsg('assistant', '⚠️ ' + data.error); return }
      addMsg('assistant', data.reply)
      if (!curSession) { setCurSession(data.sessionId); onNewSession() }
    } catch { addMsg('assistant', '⚠️ Could not reach backend.') }
    finally { setLoading(false) }
  }

  const sendDoc = async () => {
    const q = question.trim()
    if (!file || !q || loading) return
    addMsg('user', `📎 ${file.name}\n\n${q}`); setLoading(true)
    try {
      const fn = tab === '📄 PDF' ? sendFilePdf : sendFileDocx
      const data = await fn(token, file, q, curSession)
      if (data.error) { addMsg('assistant', '⚠️ ' + data.error); return }
      addMsg('assistant', data.reply)
      if (!curSession) { setCurSession(data.sessionId); onNewSession() }
    } catch { addMsg('assistant', '⚠️ Could not reach backend.') }
    finally { setLoading(false) }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    const ext = tab === '📄 PDF' ? '.pdf' : '.docx'
    if (f?.name.toLowerCase().endsWith(ext)) setFile(f)
  }

  const welcome = messages.length === 0

  return (
    <div style={S.wrap}>
      {/* Tabs */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t} style={S.tab(tab===t)} onClick={() => { setTab(t); setFile(null) }}>
            {t}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={S.messages}>
        {welcome && (
          <div style={S.welcome}>
            <div style={{ fontSize: 52 }}>🧠</div>
            <h2 style={S.welcomeTitle}>Welcome to SmartDoc</h2>
            <p style={S.welcomeSub}>
              {tab === '💬 Chat' ? 'Ask me anything powered by Google Gemini'
                : `Upload a ${tab === '📄 PDF' ? 'PDF' : 'Word'} document and ask questions about it`}
            </p>
            <div style={S.chips}>
              {tab === '💬 Chat'
                ? ['Explain quantum computing', 'Write a cover letter', 'Summarize the SOLID principles'].map(c => (
                    <button key={c} style={S.chip} onClick={() => { setInput(c); }}>
                      {c}
                    </button>
                  ))
                : null}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={S.msgWrap(m.role)} className="fade-in">
            <div style={S.avatar(m.role)}>{m.role === 'user' ? '👤' : '🧠'}</div>
            <div style={S.bubble(m.role)}>{m.text}</div>
          </div>
        ))}

        {loading && (
          <div style={S.msgWrap('assistant')} className="fade-in">
            <div style={S.avatar('assistant')}>🧠</div>
            <div style={{ ...S.bubble('assistant'), display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={S.spinner} /> Gemini is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={S.inputArea}>
        {tab === '💬 Chat' ? (
          <div style={S.chatInputRow}>
            <textarea
              style={S.textarea}
              rows={2}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg() } }}
              disabled={loading}
            />
            <button style={S.sendBtn(loading || !input.trim())} onClick={sendChatMsg} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        ) : (
          <div style={S.docArea}>
            {!file ? (
              <div style={S.dropZone(dragging)}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}>
                <span style={{ fontSize: 28 }}>{tab === '📄 PDF' ? '📄' : '📝'}</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 14 }}>
                  Click or drag {tab === '📄 PDF' ? 'PDF' : 'DOCX'} here
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max 20MB</span>
                <input ref={fileRef} type="file" accept={ACCEPTS[tab]} style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files[0])} />
              </div>
            ) : (
              <div style={S.fileTag}>
                {tab === '📄 PDF' ? '📄' : '📝'} {file.name}
                <button onClick={() => setFile(null)} style={S.removeBtn}>✕</button>
              </div>
            )}
            <div style={S.chatInputRow}>
              <textarea
                style={S.textarea}
                rows={2}
                placeholder="Ask a question about the document..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDoc() } }}
                disabled={loading}
              />
              <button style={S.sendBtn(loading || !file || !question.trim())}
                onClick={sendDoc} disabled={loading || !file || !question.trim()}>
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  wrap: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: 'var(--bg)', flex: 1
  },
  tabBar: {
    display: 'flex', gap: 8, padding: '12px 16px',
    background: 'var(--surface)', borderBottom: '1px solid var(--border)'
  },
  tab: (a) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', fontWeight: 600,
    fontSize: 13, background: a ? 'var(--primary)' : 'var(--surface2)',
    color: a ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s'
  }),
  messages: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 12
  },
  welcome: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 10, flex: 1, padding: '40px 0', textAlign: 'center'
  },
  welcomeTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text)' },
  welcomeSub: { color: 'var(--text-muted)', fontSize: 14, maxWidth: 400 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  chip: {
    padding: '8px 14px', background: 'var(--surface)', border: '1.5px solid var(--border)',
    borderRadius: 20, fontSize: 13, color: 'var(--text)', cursor: 'pointer'
  },
  msgWrap: (role) => ({
    display: 'flex', gap: 10, alignItems: 'flex-start',
    flexDirection: role === 'user' ? 'row-reverse' : 'row'
  }),
  avatar: (role) => ({
    width: 32, height: 32, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 16,
    background: role === 'user' ? 'var(--primary)' : 'var(--surface)',
    border: '1.5px solid var(--border)', flexShrink: 0
  }),
  bubble: (role) => ({
    padding: '10px 14px', borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: role === 'user' ? 'var(--primary)' : 'var(--surface)',
    color: role === 'user' ? '#fff' : 'var(--text)',
    fontSize: 14, lineHeight: 1.65, maxWidth: '75%', whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  }),
  inputArea: {
    padding: '12px 16px', background: 'var(--surface)',
    borderTop: '1px solid var(--border)'
  },
  chatInputRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  textarea: {
    flex: 1, padding: '10px 14px', fontSize: 14, resize: 'none',
    borderRadius: 12, lineHeight: 1.5
  },
  sendBtn: (dis) => ({
    padding: '0 18px', height: 46, background: dis ? 'var(--border)' : 'var(--primary)',
    color: dis ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 12,
    fontWeight: 700, fontSize: 18, transition: 'background 0.2s',
    cursor: dis ? 'not-allowed' : 'pointer'
  }),
  docArea: { display: 'flex', flexDirection: 'column', gap: 8 },
  dropZone: (drag) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '20px', borderRadius: 12, cursor: 'pointer',
    border: `2px dashed ${drag ? 'var(--primary)' : 'var(--border)'}`,
    background: drag ? 'var(--primary-light)' : 'var(--surface2)',
    transition: 'all 0.2s'
  }),
  fileTag: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'var(--primary-light)', color: 'var(--primary)',
    padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13
  },
  removeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: 14
  },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid var(--border)', borderTop: '2px solid var(--primary)',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite'
  }
}
