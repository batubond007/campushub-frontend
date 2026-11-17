import type { LoginResponse } from '@/features/auth/types'

// The signed-in user's token and profile, kept in localStorage so a page reload stays signed in.
// Storage can be unavailable (private mode), so every access is guarded.

export const SESSION_KEY = 'campushub.session'

export function saveSession(session: LoginResponse) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // The session then lasts until the page is closed.
  }
}

/** The stored session, or null when there is none or its token has expired. */
export function loadSession(): LoginResponse | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as LoginResponse
    if (!session.token || Date.parse(session.expiresAt) <= Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // Nothing stored, nothing to remove.
  }
}
