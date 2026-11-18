import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { navigate } from '@/lib/router'

/**
 * Wraps a page that only signed-in students may see (US-03).
 * Without a session — for example after logging out, or by pressing Back — the student is sent
 * to Log in, and comes back to this page after logging in.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  // Remember this page's address once: by the time an effect runs again the URL may already be /login.
  const [here] = useState(() => window.location.pathname + window.location.search)

  useEffect(() => {
    // While 'loading' the app is still asking the server for a session: wait instead of redirecting.
    if (status === 'signedOut') navigate(`/login?next=${encodeURIComponent(here)}`, { replace: true })
  }, [status, here])

  // Render nothing while loading or until redirected, so protected content never flashes on screen.
  return status === 'signedIn' ? <>{children}</> : null
}

export default RequireAuth
