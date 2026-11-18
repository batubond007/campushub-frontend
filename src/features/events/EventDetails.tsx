import { useEffect, useState } from 'react'
import { getEvent } from '@/features/events/api'
import { dateBlock, formatDuration, formatLongDay, formatTimeRange } from '@/features/events/format'
import type { EventDetail } from '@/features/events/types'
import { HttpError } from '@/lib/http'
import { Link } from '@/lib/router'
import '@/features/events/events.css'

/** US-06: everything a student needs to decide whether to attend one event. */
function EventDetails({ id }: { id: string }) {
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getEvent(id)
      .then((result) => !cancelled && setEvent(result))
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof HttpError ? { status: e.status, message: e.message } : { status: 0, message: 'Could not load this event.' })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="event-detail">
        <Link to="/events" className="back-link">← All events</Link>
        <div className="events-empty" role="alert">
          <h1 className="event-detail-missing">{error.status === 404 ? 'Event not found' : 'Something went wrong'}</h1>
          <p>{error.message}</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="event-detail">
        <p className="events-empty">Loading event…</p>
      </div>
    )
  }

  const { day, month } = dateBlock(event.startTime)

  return (
    <article className="event-detail">
      <Link to="/events" className="back-link">← All events</Link>

      <header className="event-detail-header">
        <div className="event-date event-date-large" aria-hidden="true">
          <span className="event-date-day">{day}</span>
          <span className="event-date-month">{month}</span>
        </div>
        <div>
          <div className="event-badges">
            {event.official && <span className="event-badge official">Official</span>}
            {event.ended && <span className="event-badge ended">Ended</span>}
          </div>
          <h1 className="event-detail-title">{event.title}</h1>
          <p className="event-detail-organizer">Organised by {event.organizerName}</p>
        </div>
      </header>

      {event.ended && (
        <p className="form-info" role="status">This event has already ended.</p>
      )}

      <div className="event-detail-grid">
        <section className="event-detail-card" aria-labelledby="about-title">
          <h2 id="about-title">About this event</h2>
          <div className="event-detail-description">
            {event.description.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>

        <aside className="event-detail-card" aria-label="Event information">
          <dl className="event-facts" lang="en">
            <div>
              <dt>Date</dt>
              <dd><time dateTime={event.startTime}>{formatLongDay(event.startTime)}</time></dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                {formatTimeRange(event.startTime, event.endTime)}
                <span className="event-fact-note">{formatDuration(event.startTime, event.endTime)}</span>
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{event.location}</dd>
            </div>
            <div>
              <dt>Organizer</dt>
              <dd>{event.organizerName}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </article>
  )
}

export default EventDetails
