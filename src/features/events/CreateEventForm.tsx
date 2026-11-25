import { createEvent } from '@/features/events/api'
import EventForm, { EMPTY_EVENT } from '@/features/events/EventForm'
import { navigate } from '@/lib/router'
import '@/features/events/events.css'

/** COD-118: a University Admin creates an official campus event. */
function CreateEventForm() {
  return (
    <div className="event-form-page">
      <p className="events-kicker" lang="en">University Admin</p>
      <h1 className="events-title">Create a campus event</h1>
      <p className="events-sub">Official events appear in every student’s event list right away.</p>

      <EventForm
        initial={EMPTY_EVENT}
        submitLabel="Create event"
        submittingLabel="Creating…"
        cancelTo="/events"
        onSubmit={async (body) => {
          const created = await createEvent(body)
          navigate(`/events?created=${created.id}`)
        }}
      />
    </div>
  )
}

export default CreateEventForm
