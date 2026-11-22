import RequireAuth from '@/features/auth/RequireAuth'
import RequireRole from '@/features/auth/RequireRole'
import EditEventForm from '@/features/events/EditEventForm'

// Protected and University Admin only: /events/:id/edit.
function EditEventPage({ id }: { id: string }) {
  return (
    <RequireAuth>
      <RequireRole roles={['UNIVERSITY_ADMIN']} message="Only a University Admin can edit campus events.">
        <EditEventForm id={id} />
      </RequireRole>
    </RequireAuth>
  )
}

export default EditEventPage
