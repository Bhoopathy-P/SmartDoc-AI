import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// JWT is kept ONLY in React state (never written to localStorage/sessionStorage)
// so it cannot be stolen by XSS. User display info and dark-mode pref are fine
// in localStorage because they carry no authentication power.

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)           // in-memory only
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd_user')) } catch { return null }
  })
  const [dark, setDark] = useState(() => localStorage.getItem('sd_dark') === 'true')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('sd_dark', dark)
  }, [dark])

  const login = (data) => {
    setUser({ name: data.name, email: data.email })
    setToken(data.token)                             // stays in memory only
    localStorage.setItem('sd_user', JSON.stringify({ name: data.name, email: data.email }))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('sd_user')
  }

  const toggleDark = () => setDark(d => !d)

  return (
    <AuthContext.Provider value={{ user, token, dark, login, logout, toggleDark }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
