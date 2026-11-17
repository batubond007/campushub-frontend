import RequireAuth from '@/features/auth/RequireAuth'
import EventList from '@/features/events/EventList'

// Protected: signed-in students see upcoming campus events.
function EventsPage() {
  return (
    <RequireAuth>
      <EventList />
    </RequireAuth>
  )
}

export default EventsPage
