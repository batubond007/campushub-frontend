import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { listEvents } from '@/features/events/api'
import EventCard from '@/features/events/EventCard'
import Pagination from '@/features/events/Pagination'
import type { CampusEvent, Page } from '@/features/events/types'
import { HttpError } from '@/lib/http'
import { Link, navigate, useSearch } from '@/lib/router'
import '@/features/events/events.css'

const PAGE_SIZES = [5, 10, 20, 50] as const
const DEFAULT_SIZE = 10

/**
 * Paging lives in the address (/events?page=2&size=20, page counted from 1), so Back/Forward, reload
 * and shared links keep the page. Anything invalid falls back to page 1 / the default size.
 */
function readQuery(search: string) {
  const params = new URLSearchParams(search)
  const page = Math.floor(Number(params.get('page')))
  const size = Number(params.get('size'))
  return {
    page: page >= 1 ? page : 1,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_SIZE,
    createdId: Number(params.get('created')) || null,
    deletedTitle: params.get('deleted'),
  }
}

const hrefFor = (page: number, size: number) => `/events?page=${page}&size=${size}`

/** Upcoming campus events, soonest first, one page at a time. A University Admin also gets a Create event button. */
function EventList() {
  const { user } = useAuth()
  const { page, size } = readQuery(useSearch())
  const [result, setResult] = useState<Page<CampusEvent> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // /events?created=<id> is opened right after creating an event. Remember it once, then drop ?created=
  // from the address, so a reload does not show the message again. Opening another page hides it.
  const [created] = useState(() => ({ id: readQuery(window.location.search).createdId, page, size }))
  // Same for /events?deleted=<title>, opened right after deleting an event from its detail page.
  const [deletedTitle] = useState(() => readQuery(window.location.search).deletedTitle)
  useEffect(() => {
    if (created.id || deletedTitle) window.history.replaceState(null, '', hrefFor(created.page, created.size))
  }, [created, deletedTitle])
  const createdId = created.id && created.page === page && created.size === size ? created.id : null

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listEvents(page - 1, size) // the API counts pages from 0
      .then((data) => {
        if (cancelled) return
        // Past the last page (e.g. an old link, or events have ended): go to the last page that exists.
        if (data.totalPages > 0 && page > data.totalPages) {
          navigate(hrefFor(data.totalPages, size), { replace: true })
          return
        }
        setResult(data)
      })
      .catch((e) => !cancelled && setError(e instanceof HttpError ? e.message : 'Could not load events.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [page, size])

  const events = result?.content

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

      {/* The new event may be on another page, so link to it. */}
      {createdId && (
        <p className="form-success" role="status">
          Your event was created. <Link to={`/events/${createdId}`}>View event</Link>
        </p>
      )}
      {deletedTitle && (
        <p className="form-success" role="status">“{deletedTitle}” was deleted.</p>
      )}
      {error && <p className="form-alert" role="alert">{error}</p>}

      {!result && !error && <p className="events-empty">Loading events…</p>}
      {events && events.length === 0 && <p className="events-empty">There are no upcoming events yet.</p>}
      {events && events.length > 0 && (
        <>
          <ul className="event-list" aria-busy={loading}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} highlight={event.id === createdId} />
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={result.totalPages}
            size={size}
            sizes={PAGE_SIZES}
            totalElements={result.totalElements}
            hrefFor={hrefFor}
            // A new page size starts again at page 1.
            onSizeChange={(newSize) => navigate(hrefFor(1, newSize))}
          />
        </>
      )}
    </div>
  )
}

export default EventList
