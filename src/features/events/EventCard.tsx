import { dateBlock, formatDay, formatTimeRange } from '@/features/events/format'
import type { CampusEvent } from '@/features/events/types'
import { Link } from '@/lib/router'

/** One event in the list; the whole card opens its detail page. `highlight` marks a just-created event. */
function EventCard({ event, highlight }: { event: CampusEvent; highlight?: boolean }) {
  const { day, month } = dateBlock(event.startTime)

  return (
    <li className={highlight ? 'event-card is-new' : 'event-card'}>
      <Link to={`/events/${event.id}`} className="event-card-link">
        <div className="event-date" aria-hidden="true">
          <span className="event-date-day">{day}</span>
          <span className="event-date-month">{month}</span>
        </div>
        <div className="event-body">
          <div className="event-badges">
            {event.official && <span className="event-badge official">Official</span>}
            {highlight && <span className="event-badge new">New</span>}
          </div>
          <h2 className="event-title">{event.title}</h2>
          <p className="event-meta">
            <time dateTime={event.startTime}>{formatDay(event.startTime)} · {formatTimeRange(event.startTime, event.endTime)}</time>
          </p>
          <p className="event-meta">{event.location}</p>
          <p className="event-description">{event.description}</p>
          <p className="event-organizer">
            by {event.organizerName}
            <span className="event-more" aria-hidden="true">View details →</span>
          </p>
        </div>
      </Link>
    </li>
  )
}

export default EventCard
