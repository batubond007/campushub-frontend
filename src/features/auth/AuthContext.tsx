import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest } from '@/features/auth/api'
import { clearSession, loadSession, saveSession, SESSION_KEY } from '@/features/auth/session'
import type { LoginRequest, Profile } from '@/features/auth/types'
import { HttpError } from '@/lib/http'

// US-03: who is signed in, shared by every page. Pages read it with useAuth().

interface AuthState {
  user: Profile | null
  token: string | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadSession)

  // A stored token may have been ended elsewhere (log-out on another device, account disabled).
  // Ask the server once on start-up; a 401 signs the user out here too.
  useEffect(() => {
    const stored = loadSession()
    if (!stored) return
    getMe(stored.token)
      .then((user) => {
        const updated = { ...stored, user }
        saveSession(updated)
        setSession(updated)
      })
      .catch((error: unknown) => {
        if (error instanceof HttpError && error.status === 401) {
          clearSession()
          setSession(null)
        }
        // Other errors (server down): keep the session and try again on the next visit.
      })
  }, [])

  // Logging in or out in one browser tab updates the other open tabs.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) setSession(loadSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await loginRequest(credentials)
    saveSession(result)
    setSession(result)
  }, [])

  const logout = useCallback(async () => {
    const token = loadSession()?.token
    // Always end the session in this browser, even if the server cannot be reached.
    clearSession()
    setSession(null)
    if (token) await logoutRequest(token).catch(() => undefined)
  }, [])

  const value = useMemo(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, login, logout }),
    [session, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
