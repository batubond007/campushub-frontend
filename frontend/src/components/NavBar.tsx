import { useAuth } from '../auth';
import { Link, useRouter } from '../router';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { path, navigate } = useRouter();

  const link = (to: string, label: string) => (
    <Link to={to} className={path === to ? 'active' : undefined} aria-current={path === to ? 'page' : undefined}>
      {label}
    </Link>
  );

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">CampusHub</Link>
        <nav aria-label="Main">
          {user ? (
            <>
              {link('/events', 'Events')}
              {(user.role === 'CLUB_MANAGER' || user.role === 'SYSTEM_ADMIN') && link('/events/new', 'New event')}
              {user.role === 'SYSTEM_ADMIN' && link('/admin/users', 'Users')}
              {link('/profile', 'Profile')}
              <button type="button" className="link-button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              {link('/login', 'Log in')}
              {link('/register', 'Sign up')}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
