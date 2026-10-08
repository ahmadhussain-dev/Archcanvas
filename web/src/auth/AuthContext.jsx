import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, onSessionEnded, refreshSession, setAccessToken } from '../lib/api.js'

const AuthContext = createContext(null)

// status: 'loading' while we check the refresh cookie, then 'in' or 'out'.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [sessionEnded, setSessionEnded] = useState(false)

  useEffect(() => {
    let alive = true
    refreshSession()
      .then((u) => alive && (setUser(u), setStatus('in')))
      .catch(() => alive && setStatus('out'))
    onSessionEnded(() => {
      setUser(null)
      setStatus('out')
      setSessionEnded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const start = useCallback((data) => {
    setAccessToken(data.accessToken)
    setUser(data.user)
    setStatus('in')
    setSessionEnded(false)
    return data.user
  }, [])

  const login = useCallback(
    async (email, password) => start(await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })),
    [start]
  )

  const register = useCallback(
    async (name, email, password) =>
      start(await api('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })),
    [start]
  )

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST', auth: false })
    } finally {
      setAccessToken(null)
      setUser(null)
      setStatus('out')
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, sessionEnded, login, register, logout }),
    [user, status, sessionEnded, login, register, logout]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
