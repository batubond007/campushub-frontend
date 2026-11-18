import { login as loginRequest, logout as logoutRequest, refresh as refreshRequest } from '@/features/auth/api'
import type { AuthSession, LoginRequest } from '@/features/auth/types'
import { HttpError, setAccessTokenSource } from '@/lib/http'

// US-03: the signed-in session, shared by the whole app (AuthContext reads it with useSyncExternalStore).
//
// - The access token lives only in memory (this module), never in localStorage, so a script injected
//   into the page (XSS) cannot read a long-lived credential from storage.
// - The refresh token is an httpOnly cookie set by the server; JavaScript never sees it.
// - After a page load there is no access token yet, so the app asks /api/auth/refresh once ("loading").
// - When the access token expires, http() calls refreshSession() and retries; if the refresh is refused,
//   the session has ended and protected pages send the student to Log in.

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

export interface AuthSnapshot {
  status: AuthStatus
  session: AuthSession | null
}

/** Refresh a little before the real expiry, so a token does not run out on its way to the server. */
const EXPIRY_MARGIN_MS = 10_000

let snapshot: AuthSnapshot = { status: 'loading', session: null }
const listeners = new Set<() => void>()

// Bumped by every log-in and log-out (also from other tabs). A refresh that started before must not
// overwrite their result, e.g. bring a session back right after the student logged out.
let generation = 0
// Only one refresh at a time: requests that fail together share the same refresh.
let inFlight: Promise<string | null> | null = null

function setSession(session: AuthSession | null) {
  snapshot = { status: session ? 'signedIn' : 'signedOut', session }
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot() {
  return snapshot
}

function currentAccessToken() {
  const session = snapshot.session
  if (!session) return null
  return Date.parse(session.expiresAt) - EXPIRY_MARGIN_MS > Date.now() ? session.accessToken : null
}

// Several tabs share one refresh cookie. With rotation, two tabs refreshing at the same moment would send
// the same token twice, which the server treats as theft. The Web Locks API lets only one tab refresh at a time.
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  return locks ? locks.request('campushub-refresh', task) : task()
}

/**
 * Gets a new access token with the refresh cookie. Resolves to null when the session has ended (401);
 * rejects when the server cannot be reached, so a network problem does not log the student out.
 */
export function refreshSession(): Promise<string | null> {
  if (inFlight) return inFlight
  const startedAt = generation
  inFlight = withRefreshLock(() => refreshRequest())
    .then(
      (session) => {
        if (generation !== startedAt) return currentAccessToken()
        setSession(session)
        return session.accessToken
      },
      (error: unknown) => {
        if (generation !== startedAt) return currentAccessToken()
        if (error instanceof HttpError && error.status === 401) {
          setSession(null)
          return null
        }
        // Server unreachable. On start-up we cannot know who is signed in, so show the app signed out;
        // later, keep the session and let the caller show the network error.
        if (snapshot.status === 'loading') setSession(null)
        throw error
      },
    )
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** Called once when the app starts: is there still a session from an earlier visit? */
export function startSession() {
  if (snapshot.status === 'loading') refreshSession().catch(() => undefined)
}

// Tell other open tabs about log-in / log-out, so they update right away.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('campushub-auth') : null

channel?.addEventListener('message', (event: MessageEvent) => {
  if (event.data === 'logout') {
    generation++
    setSession(null)
  } else if (event.data === 'login') {
    generation++
    refreshSession().catch(() => undefined) // picks up the new refresh cookie
  }
})

export async function login(credentials: LoginRequest) {
  const session = await loginRequest(credentials)
  generation++
  setSession(session)
  channel?.postMessage('login')
}

export async function logout() {
  // End the session in this browser first, even if the server cannot be reached.
  generation++
  setSession(null)
  channel?.postMessage('logout')
  await logoutRequest().catch(() => undefined)
}

setAccessTokenSource({ current: currentAccessToken, refresh: refreshSession })
