import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import type { Role } from '@/features/auth/types'
import { Link } from '@/lib/router'

/**
 * Shows the page only to the given roles. Use inside <RequireAuth>.
 * Everyone else sees a short explanation instead (the backend refuses them too).
 */
function RequireRole({ roles, message, children }: { roles: Role[]; message: string; children: ReactNode }) {
  const { user } = useAuth()
  if (user && roles.includes(user.role)) return <>{children}</>

  return (
    <div className="no-access" role="alert">
      <h1>You can’t open this page</h1>
      <p>{message}</p>
      <Link to="/events" className="button primary">Back to events</Link>
    </div>
  )
}

export default RequireRole
