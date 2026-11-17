import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import type { Role } from '@/features/auth/types'
import { navigate } from '@/lib/router'
import '@/features/account/account.css'

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  CLUB_MANAGER: 'Club Manager',
  UNIVERSITY_ADMIN: 'University Admin',
  SYSTEM_ADMIN: 'System Admin',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toLocaleUpperCase('tr-TR')
}

/** The signed-in student's own page: who they are, and a way to log out (US-03). */
function AccountOverview() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  if (!user) return null

  async function handleLogout() {
    setLoggingOut(true)
    // Leave this protected page in the same step as the session ends,
    // so the guard never sees "signed out on /account" and adds its own redirect.
    const done = logout()
    navigate('/login?loggedOut=1', { replace: true })
    await done
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="account">
      <section className="account-hero">
        <span className="account-avatar" aria-hidden="true">{initials(user.fullName)}</span>
        <div>
          <p className="account-kicker">My account</p>
          <h1 className="account-name">Welcome, {user.fullName.split(' ')[0]}!</h1>
          <p className="account-sub">You are signed in to CampusHub.</p>
        </div>
      </section>

      <div className="account-grid">
        <section className="account-card">
          <h2>Account details</h2>
          <dl className="account-details">
            <dt>Full name</dt>
            <dd>{user.fullName}</dd>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
            <dt>Status</dt>
            <dd><span className="status-badge">Verified</span></dd>
            <dt>Member since</dt>
            <dd>{memberSince}</dd>
          </dl>
        </section>

        <section className="account-card">
          <h2>Coming soon</h2>
          <p className="account-muted">
            Your events, study groups and clubs will appear here as new CampusHub features arrive.
          </p>
          <h2 className="account-logout-title">Log out</h2>
          <p className="account-muted">
            Logging out ends your session on every device. You will need your password to come back.
          </p>
          <button type="button" className="button account-logout" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </section>
      </div>
    </div>
  )
}

export default AccountOverview
