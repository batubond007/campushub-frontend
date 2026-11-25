import { useEffect, useState } from 'react'
import { getEvent, updateEvent } from '@/features/events/api'
import EventForm from '@/features/events/EventForm'
import type { EventDetail } from '@/features/events/types'
import { fromIso, type EventFormValues } from '@/features/events/validation'
import { HttpError } from '@/lib/http'
import { Link, navigate } from '@/lib/router'
import '@/features/events/events.css'

function toFormValues(event: EventDetail): EventFormValues {
  const start = fromIso(event.startTime)
  const end = fromIso(event.endTime)
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
  }
}

/** A University Admin changes an existing event, starting from its current values. */
function EditEventForm({ id }: { id: string }) {
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
      <div className="event-form-page">
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
      <div className="event-form-page">
        <p className="events-empty">Loading event…</p>
      </div>
    )
  }

  return (
    <div className="event-form-page">
      <Link to={`/events/${event.id}`} className="back-link">← Back to event</Link>
      <p className="events-kicker" lang="en">University Admin</p>
      <h1 className="events-title">Edit event</h1>
      <p className="events-sub">Changes are shown to every student right away.</p>

      {event.ended ? (
        <p className="form-info" role="status">This event has already ended and can no longer be edited.</p>
      ) : (
        <EventForm
          initial={toFormValues(event)}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          cancelTo={`/events/${event.id}`}
          onSubmit={async (body) => {
            await updateEvent(event.id, body)
            navigate(`/events/${event.id}?updated=1`)
          }}
        />
      )}
    </div>
  )
}

export default EditEventForm
