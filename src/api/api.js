const BASE = '/api'

function authHeaders(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  return res.json()
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return res.json()
}

export async function sendChat(token, message, sessionId) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ message, sessionId: sessionId || null })
  })
  return res.json()
}

export async function sendFilePdf(token, file, question, sessionId) {
  const form = new FormData()
  form.append('file', file)
  form.append('question', question)
  if (sessionId) form.append('sessionId', sessionId)
  const res = await fetch(`${BASE}/chat/pdf`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  })
  return res.json()
}

export async function sendFileDocx(token, file, question, sessionId) {
  const form = new FormData()
  form.append('file', file)
  form.append('question', question)
  if (sessionId) form.append('sessionId', sessionId)
  const res = await fetch(`${BASE}/chat/docx`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form
  })
  return res.json()
}

export async function getSessions(token) {
  const res = await fetch(`${BASE}/chat/sessions`, {
    headers: authHeaders(token)
  })
  return res.json()
}

export async function getSessionMessages(token, sessionId) {
  const res = await fetch(`${BASE}/chat/sessions/${sessionId}/messages`, {
    headers: authHeaders(token)
  })
  return res.json()
}

export async function deleteSession(token, sessionId) {
  const res = await fetch(`${BASE}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  })
  return res.json()
}
