import '@/components/NavBar.css'
import { useAuth } from '@/features/auth/AuthContext'
import { Link, navigate } from '@/lib/router'

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'university', label: 'Partners' },
  { id: 'team', label: 'Us' },
]

// Top navigation bar, shared by every page.
// Signed out: page sections, Log in / Sign up. Signed in: Events (+ Create event for University Admins),
// the user's name for My account, and Log out (US-03).
function NavBar() {
  const { status, user, logout } = useAuth()

  function handleLogout() {
    // Navigate in the same step as the session ends (see AccountOverview), then finish in the background.
    void logout()
    navigate('/login?loggedOut=1', { replace: true })
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          Campus<span className="brand-accent">Hub</span>
        </Link>
        <nav aria-label="Main" className="nav-links">
          {user ? (
            <>
              <Link to="/events" className="nav-link">Events</Link>
              {user.role === 'UNIVERSITY_ADMIN' && <Link to="/events/new" className="nav-link">Create event</Link>}
            </>
          ) : (
            SECTIONS.map((section) => (
              <a key={section.id} href={`/#${section.id}`} className="nav-link">
                {section.label}
              </a>
            ))
          )}
          {user ? (
            <span className="nav-auth">
              <Link to="/account" className="nav-user" title={user.email}>
                <span className="nav-user-avatar" aria-hidden="true">
                  {user.fullName.trim()[0]?.toLocaleUpperCase('tr-TR')}
                </span>
                <span className="nav-user-name">{user.fullName.split(' ')[0]}</span>
              </Link>
              <button type="button" className="button" onClick={handleLogout}>Log out</button>
            </span>
          ) : status === 'loading' ? null : ( // no Log in / Sign up flash while the session is checked
            <span className="nav-auth">
              <Link to="/login" className="button">Log in</Link>
              <Link to="/signup" className="button primary">Sign up</Link>
            </span>
          )}
        </nav>
      </div>
    </header>
  )
}

export default NavBar
