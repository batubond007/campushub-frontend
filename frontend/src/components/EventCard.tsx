import { EventSummary } from '../api';
import { formatEventTime, seatsLabel } from '../format';
import { Link } from '../router';

export default function EventCard({ event }: { event: EventSummary }) {
  return (
    <li className="event-card">
      <Link to={`/events/${event.id}`}>
        <h2>{event.title}</h2>
        <p className="event-time">{formatEventTime(event.startTime, event.endTime)}</p>
        <p className="muted">{event.online ? 'Online' : event.location} · by {event.organizerName}</p>
        <div className="badges">
          {event.joined && <span className="badge joined">Joined</span>}
          <span className={`badge ${event.full ? 'full' : ''}`}>{seatsLabel(event.capacity, event.participantCount)}</span>
        </div>
      </Link>
    </li>
  );
}
