import type { LoginResponse } from '@/features/auth/types'

const SESSION_KEY = 'campushub.session'

/** Keeps the signed-in user's token. Storage can be unavailable (private mode), so errors are ignored. */
export function saveSession(session: LoginResponse) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // The session then lasts until the page is closed.
  }
}
