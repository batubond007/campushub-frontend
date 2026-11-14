import { Link } from '../router';

export default function NotFoundPage() {
  return (
    <div className="card narrow">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <p><Link to="/">Go to CampusHub</Link></p>
    </div>
  );
}
