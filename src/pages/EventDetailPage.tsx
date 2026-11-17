import RequireAuth from '@/features/auth/RequireAuth'
import EventDetails from '@/features/events/EventDetails'

// Protected: /events/:id shows one event's description, time, location and organizer (US-06).
function EventDetailPage({ id }: { id: string }) {
  return (
    <RequireAuth>
      <EventDetails id={id} />
    </RequireAuth>
  )
}

export default EventDetailPage
