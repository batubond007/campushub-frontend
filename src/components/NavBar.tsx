import '@/components/NavBar.css'
import { Link } from '@/lib/router'

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'university', label: 'ODTÜ' },
  { id: 'team', label: 'Team' },
]

// Top navigation bar, shared by every page.
function NavBar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          Campus<span className="brand-accent">Hub</span>
        </Link>
        <nav aria-label="Main" className="nav-links">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`/#${section.id}`} className="nav-link">
              {section.label}
            </a>
          ))}
          <span className="nav-auth">
            <Link to="/login" className="button">Log in</Link>
            <Link to="/signup" className="button primary">Sign up</Link>
          </span>
        </nav>
      </div>
    </header>
  )
}

export default NavBar
