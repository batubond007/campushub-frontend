import { FormEvent, useState } from 'react';
import Field from '../components/Field';
import { ApiError } from '../api';
import { useAuth } from '../auth';
import { Link, useRouter } from '../router';
import { resetDb } from '../mock/db';

const DEMO_ACCOUNTS = [
  { label: 'System Admin', email: 'admin@metu.edu.tr', password: 'ChangeMe2026' },
  { label: 'Club Manager', email: 'mehmet.kaya@metu.edu.tr', password: 'Demo1234' },
  { label: 'Student', email: 'ayse.yilmaz@metu.edu.tr', password: 'Demo1234' },
];

/** US-03: log in. */
export default function LoginPage() {
  const { login } = useAuth();
  const { query, navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/events');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>Log in</h1>
      {query.get('verified') && (
        <p className="alert success" role="status">Your account is verified. You can log in now.</p>
      )}
      {error && <p className="alert error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <Field id="email" label="University e-mail" type="email" value={email}
               onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <Field id="password" label="Password" type="password" value={password}
               onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        <button type="submit" className="button primary full" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="muted small">New to CampusHub? <Link to="/register">Create an account</Link></p>
      <p className="muted small">Signed up but not verified? <Link to="/verify">Enter your code</Link></p>
      <div className="alert info" role="note">
        <strong>Demo mode</strong> — no backend, all data is mock data kept in this browser. Use a demo account:
        <ul>
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button type="button" className="link-button"
                      onClick={() => { setEmail(account.email); setPassword(account.password); }}>
                {account.label}
              </button>{' '}
              <span className="muted small">{account.email} / {account.password}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="link-button small"
                onClick={() => { resetDb(); setError(null); window.alert('Demo data was reset.'); }}>
          Reset demo data
        </button>
      </div>
    </div>
  );
}
