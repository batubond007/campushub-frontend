import { FormEvent, useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import Field from '../components/Field';
import RequireAuth from '../components/RequireAuth';
import { api, ApiError, EventSummary, Profile, roleLabels } from '../api';
import { useAuth } from '../auth';

/** US-04: create and edit profile. Also lists the events the student joined. */
function ProfileEditor() {
  const { token, user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    department: user?.department ?? '',
    bio: user?.bio ?? '',
    interests: (user?.interests ?? []).join(', '),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [myEvents, setMyEvents] = useState<EventSummary[] | null>(null);

  useEffect(() => {
    api<EventSummary[]>('/api/me/events', { token }).then(setMyEvents).catch(() => setMyEvents([]));
  }, [token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const interests = form.interests.split(',').map((i) => i.trim()).filter(Boolean);
      const updated = await api<Profile>('/api/me', {
        method: 'PUT',
        token,
        body: { fullName: form.fullName, department: form.department, bio: form.bio, interests },
      });
      setUser(updated);
      setMessage({ kind: 'success', text: 'Profile saved.' });
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors);
        setMessage({ kind: 'error', text: e.message });
      }
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="stack">
      <section className="card narrow">
        <h1>Your profile</h1>
        <p className="muted">{user.email} · {roleLabels[user.role]}</p>
        {message && (
          <p className={`alert ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <Field id="fullName" label="Full name" value={form.fullName} maxLength={100} required error={errors.fullName}
                 onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Field id="department" label="Department" value={form.department} maxLength={100} error={errors.department}
                 onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <div className="field">
            <label htmlFor="bio">About you</label>
            <textarea id="bio" rows={3} maxLength={500} value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            {errors.bio && <p className="field-error">{errors.bio}</p>}
          </div>
          <Field id="interests" label="Interests" value={form.interests} error={errors.interests}
                 hint="Separate with commas, for example: music, robotics, hiking. Up to 10."
                 onChange={(e) => setForm({ ...form, interests: e.target.value })} />
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section>
        <h2>Events you joined</h2>
        {myEvents === null && <p className="muted">Loading…</p>}
        {myEvents?.length === 0 && <p className="muted">You have not joined any upcoming events yet.</p>}
        {myEvents && myEvents.length > 0 && (
          <ul className="event-grid">
            {myEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileEditor />
    </RequireAuth>
  );
}
