import { useEffect } from 'react';
import { Role } from '../api';
import { useAuth } from '../auth';
import { useRouter } from '../router';

/** Shows the page only to signed-in users, and optionally only to some roles. */
export default function RequireAuth({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return <p className="muted">Loading…</p>;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h1>Not available</h1>
        <p>You do not have permission to open this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
