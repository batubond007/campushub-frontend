import { Link } from '../router';
import { useEffect, useState } from 'react';
import RequireAuth from '../components/RequireAuth';
import { api, ApiError, EventDetail } from '../api';
import { useAuth } from '../auth';
import { formatEventTime, seatsLabel } from '../format';

/** US-06: event details. US-07: join or leave the event. */
function EventDetails({ id }: { id: string }) {
  const { token } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<EventDetail>(`/api/events/${id}`, { token })
      .then(setEvent)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load this event.'));
  }, [id, token]);

  async function changeRegistration(join: boolean) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api<EventDetail>(`/api/events/${id}/registration`, {
        method: join ? 'POST' : 'DELETE',
        token,
      });
      setEvent(updated);
      setNotice(join ? 'You joined this event. Your place is saved.' : 'You left this event.');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!event) {
    return error ? <p className="alert error" role="alert">{error}</p> : <p className="muted">Loading…</p>;
  }

  return (
    <article className="card">
      <p className="small"><Link to="/events">← All events</Link></p>
      <h1>{event.title}</h1>
      <dl className="details">
        <dt>When</dt>
        <dd>{formatEventTime(event.startTime, event.endTime)}</dd>
        <dt>Where</dt>
        <dd>{event.online ? `Online · ${event.location}` : event.location}</dd>
        <dt>Organizer</dt>
        <dd>{event.organizerName}</dd>
        <dt>Participants</dt>
        <dd>{seatsLabel(event.capacity, event.participantCount)}</dd>
      </dl>
      <p className="description">{event.description}</p>

      {error && <p className="alert error" role="alert">{error}</p>}
      {notice && <p className="alert success" role="status">{notice}</p>}

      <div className="actions">
        {event.ended ? (
          <p className="muted">This event has ended.</p>
        ) : event.joined ? (
          <button type="button" className="button" disabled={busy} onClick={() => changeRegistration(false)}>
            Leave event
          </button>
        ) : (
          <button type="button" className="button primary" disabled={busy || event.full}
                  onClick={() => changeRegistration(true)}>
            {event.full ? 'Event is full' : 'Join event'}
          </button>
        )}
      </div>
    </article>
  );
}

export default function EventDetailPage({ id }: { id: string }) {
  return (
    <RequireAuth>
      <EventDetails id={id} />
    </RequireAuth>
  );
}
