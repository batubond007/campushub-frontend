import { FormEvent, useState } from 'react';
import Field from '../components/Field';
import { api, ApiError } from '../api';
import { Link, useRouter } from '../router';

/** US-01: sign up with university e-mail. */
export default function RegisterPage() {
  const { navigate } = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);
    try {
      await api('/api/auth/register', { method: 'POST', body: form });
      navigate(`/verify?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setMessage(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="card narrow">
      <h1>Create your account</h1>
      <p className="muted">Use your university e-mail address. We will send you a code to verify it.</p>
      {message && <p className="alert error" role="alert">{message}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <Field id="fullName" label="Full name" value={form.fullName} onChange={update('fullName')}
               autoComplete="name" required error={errors.fullName} />
        <Field id="email" label="University e-mail" type="email" value={form.email} onChange={update('email')}
               autoComplete="email" placeholder="name@metu.edu.tr" required error={errors.email} />
        <Field id="password" label="Password" type="password" value={form.password} onChange={update('password')}
               autoComplete="new-password" required error={errors.password}
               hint="At least 8 characters, with a letter and a number." />
        <button type="submit" className="button primary full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="muted small">Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
