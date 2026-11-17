import type { ReactNode } from 'react'
import '@/features/auth/auth.css'

// Two-column frame shared by the Log in and Sign up pages:
// a photo panel with the CampusHub message on the left, the form card on the right.
function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-text">
          <p className="auth-visual-kicker" lang="en">Only for ODTÜ students</p>
          <p className="auth-visual-title">Connect. Participate. Share. Belong.</p>
          <ul className="auth-visual-list">
            <li>Join campus events in one click</li>
            <li>Find study groups and clubs</li>
            <li>Lost &amp; found and a student marketplace</li>
          </ul>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  )
}

export default AuthLayout
