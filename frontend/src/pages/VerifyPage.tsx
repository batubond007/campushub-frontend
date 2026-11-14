import { FormEvent, useState } from 'react';
import Field from '../components/Field';
import { api, ApiError } from '../api';
import { Link, useRouter } from '../router';
import { DEMO_OTP } from '../mock/db';

/** US-02: verify e-mail with OTP. */
export default function VerifyPage() {
  const { query, navigate } = useRouter();
  const [email, setEmail] = useState(query.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await api('/api/auth/verify', { method: 'POST', body: { email, code: code.trim() } });
      navigate('/login?verified=1');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    try {
      await api('/api/auth/resend-otp', { method: 'POST', body: { email } });
      setInfo(`We sent a new code. (Demo code: ${DEMO_OTP})`);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    }
  }

  return (
    <div className="card narrow">
      <h1>Verify your e-mail</h1>
      <p className="muted">Enter the 6-digit code we sent to your university e-mail. The code is valid for 10 minutes.</p>
      <p className="alert info" role="note">Demo mode: no e-mail is sent. The code is always <strong>{DEMO_OTP}</strong>.</p>
      {error && <p className="alert error" role="alert">{error}</p>}
      {info && <p className="alert success" role="status">{info}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <Field id="email" label="University e-mail" type="email" value={email}
               onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <Field id="code" label="Verification code" value={code} onChange={(e) => setCode(e.target.value)}
               inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
        <button type="submit" className="button primary full" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify account'}
        </button>
      </form>
      <p className="muted small">
        Didn’t get a code? <button type="button" className="link-button" onClick={handleResend}>Send a new code</button>
      </p>
      <p className="muted small"><Link to="/login">Back to log in</Link></p>
    </div>
  );
}
