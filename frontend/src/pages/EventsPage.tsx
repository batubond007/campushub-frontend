import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import RequireAuth from '../components/RequireAuth';
import { api, ApiError, EventSummary, Page } from '../api';
import { useAuth } from '../auth';

/** US-06: see campus events. */
function EventList() {
  const { token } = useAuth();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<EventSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api<Page<EventSummary>>(`/api/events?page=${page}&size=12`, { token })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load events.'));
  }, [page, token]);

  return (
    <>
      <h1>Upcoming campus events</h1>
      {error && <p className="alert error" role="alert">{error}</p>}
      {!data && !error && <p className="muted">Loading events…</p>}
      {data && data.content.length === 0 && (
        <div className="card">
          <p>There are no upcoming events yet. Club managers can add events from “New event”.</p>
        </div>
      )}
      {data && data.content.length > 0 && (
        <ul className="event-grid">
          {data.content.map((event) => <EventCard key={event.id} event={event} />)}
        </ul>
      )}
      {data && data.totalPages > 1 && (
        <div className="pager">
          <button type="button" className="button" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="muted">Page {page + 1} of {data.totalPages}</span>
          <button type="button" className="button" disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </>
  );
}

export default function EventsPage() {
  return (
    <RequireAuth>
      <EventList />
    </RequireAuth>
  );
}
