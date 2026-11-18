import { Link } from '@/lib/router'

// Shown for any address that matches no route, e.g. a mistyped link.
function NotFoundPage() {
  return (
    <div className="no-access" role="alert">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or may have been moved.</p>
      <Link to="/" className="button primary">Back to home</Link>
    </div>
  )
}

export default NotFoundPage
