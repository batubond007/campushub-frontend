import RequireAuth from '@/features/auth/RequireAuth'
import RequireRole from '@/features/auth/RequireRole'
import CreateEventForm from '@/features/events/CreateEventForm'

// Protected and University Admin only (COD-118).
function NewEventPage() {
  return (
    <RequireAuth>
      <RequireRole roles={['UNIVERSITY_ADMIN']} message="Only a University Admin can create campus events.">
        <CreateEventForm />
      </RequireRole>
    </RequireAuth>
  )
}

export default NewEventPage
