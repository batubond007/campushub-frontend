import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { listEvents } from '@/features/events/api'
import EventCard from '@/features/events/EventCard'
import type { CampusEvent } from '@/features/events/types'
import { HttpError } from '@/lib/http'
import { getQueryParam, Link } from '@/lib/router'
import '@/features/events/events.css'

/** Upcoming campus events, soonest first. A University Admin also gets a Create event button. */
function EventList() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CampusEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // /events?created=<id> is opened right after creating an event: show a message and mark that card.
  const [createdId] = useState(() => Number(getQueryParam('created')) || null)

  useEffect(() => {
    let cancelled = false
    listEvents()
      .then((page) => !cancelled && setEvents(page.content))
      .catch((e) => !cancelled && setError(e instanceof HttpError ? e.message : 'Could not load events.'))
    return () => {
      cancelled = true
    }
  }, [])

  const created = events?.find((event) => event.id === createdId)

  return (
    <div className="events">
      <header className="events-header">
        <div>
          <p className="events-kicker" lang="en">Campus events</p>
          <h1 className="events-title">Upcoming events</h1>
          <p className="events-sub">Official campus events, soonest first.</p>
        </div>
        {user?.role === 'UNIVERSITY_ADMIN' && (
          <Link to="/events/new" className="button primary">+ Create event</Link>
        )}
      </header>

      {created && (
        <p className="form-success" role="status">
          “{created.title}” was created and is now in the event list.
        </p>
      )}
      {error && <p className="form-alert" role="alert">{error}</p>}

      {!events && !error && <p className="events-empty">Loading events…</p>}
      {events && events.length === 0 && <p className="events-empty">There are no upcoming events yet.</p>}
      {events && events.length > 0 && (
        <ul className="event-list">
          {events.map((event) => (
            <EventCard key={event.id} event={event} highlight={event.id === createdId} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default EventList
