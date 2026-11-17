import '@/components/NavBar.css'

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'university', label: 'ODTÜ' },
  { id: 'team', label: 'Team' },
]

// Top navigation bar, shared by every page.
// TODO: point Log in / Sign up at the auth pages once client-side routing is added.
function NavBar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="/" className="brand">
          Campus<span className="brand-accent">Hub</span>
        </a>
        <nav aria-label="Main" className="nav-links">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="nav-link">
              {section.label}
            </a>
          ))}
          <span className="nav-auth">
            <a href="/login" className="button">Log in</a>
            <a href="/register" className="button primary">Sign up</a>
          </span>
        </nav>
      </div>
    </header>
  )
}

export default NavBar
