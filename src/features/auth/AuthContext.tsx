import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { getSnapshot, login, logout, startSession, subscribe, type AuthStatus } from '@/features/auth/session'
import type { LoginRequest, Profile } from '@/features/auth/types'

// US-03: who is signed in, shared by every page. Pages read it with useAuth().
// The session itself (tokens, refresh) lives in session.ts.

interface AuthState {
  /** 'loading' right after the page opens, until the server says whether a session still exists. */
  status: AuthStatus
  user: Profile | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    startSession()
  }, [])

  const value = useMemo(
    () => ({ status: snapshot.status, user: snapshot.session?.user ?? null, login, logout }),
    [snapshot],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
