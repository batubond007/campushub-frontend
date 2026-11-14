import { useRouter } from '../router';
import { FormEvent, useState } from 'react';
import Field from '../components/Field';
import RequireAuth from '../components/RequireAuth';
import { api, ApiError, EventDetail } from '../api';
import { useAuth } from '../auth';

/** Basic event creation for club managers and system admins. The participation quota comes with US-09 (Release 2). */
function NewEventForm() {
  const { token } = useAuth();
  const { navigate } = useRouter();
  const [form, setForm] = useState({ title: '', description: '', location: '', online: false, start: '', end: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setMessage(null);
    if (!form.start || !form.end) {
      setMessage('Please choose a start and end time.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api<EventDetail>('/api/events', {
        method: 'POST',
        token,
        body: {
          title: form.title,
          description: form.description,
          location: form.location,
          online: form.online,
          startTime: new Date(form.start).toISOString(),
          endTime: new Date(form.end).toISOString(),
        },
      });
      navigate(`/events/${created.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors);
        setMessage(e.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>New event</h1>
      {message && <p className="alert error" role="alert">{message}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <Field id="title" label="Title" value={form.title} maxLength={120} required error={errors.title}
               onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={5} maxLength={2000} value={form.description}
                    aria-invalid={!!errors.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>
        <Field id="location" label="Location or online link" value={form.location} maxLength={200} required
               error={errors.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <label className="checkbox">
          <input type="checkbox" checked={form.online} onChange={(e) => setForm({ ...form, online: e.target.checked })} />
          This is an online event
        </label>
        <div className="row">
          <Field id="start" label="Starts" type="datetime-local" value={form.start} required error={errors.startTime}
                 onChange={(e) => setForm({ ...form, start: e.target.value })} />
          <Field id="end" label="Ends" type="datetime-local" value={form.end} required error={errors.endTime}
                 onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </div>
        <button type="submit" className="button primary full" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish event'}
        </button>
      </form>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <RequireAuth roles={['CLUB_MANAGER', 'SYSTEM_ADMIN']}>
      <NewEventForm />
    </RequireAuth>
  );
}
