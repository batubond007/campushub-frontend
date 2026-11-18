import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import type { Role } from '@/features/auth/types'
import { Link } from '@/lib/router'

/**
 * Shows the page only to the given roles. Use inside <RequireAuth>.
 * Everyone else sees a short explanation instead. This is only for a clear screen: the backend must refuse
 * them too (403 FORBIDDEN), since anyone can call the API without this page.
 */
function RequireRole({ roles, message, children }: { roles: Role[]; message: string; children: ReactNode }) {
  const { user } = useAuth()
  if (user && roles.includes(user.role)) return <>{children}</>

  return (
    // Page content, not a sudden alert: no role="alert", so screen readers read it like any other page.
    <div className="no-access">
      <h1>You can’t open this page</h1>
      <p>{message}</p>
      <Link to="/events" className="button primary">Back to events</Link>
    </div>
  )
}

export default RequireRole
