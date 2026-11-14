import { useEffect } from 'react';
import { useAuth } from '../auth';
import { useRouter } from '../router';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading) navigate(user ? '/events' : '/login', { replace: true });
  }, [loading, user, navigate]);

  return <p className="muted">Loading…</p>;
}
