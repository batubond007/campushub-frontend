import { useState, type ChangeEvent, type FormEvent } from 'react'
import { FormField } from '@/components/FormField'
import { createEvent } from '@/features/events/api'
import { LIMITS, todayString, toDate, validateEvent, type EventFormErrors, type EventFormValues } from '@/features/events/validation'
import { HttpError } from '@/lib/http'
import { Link, navigate } from '@/lib/router'
import '@/features/events/events.css'

const EMPTY: EventFormValues = {
  title: '', description: '', location: '', startDate: '', startTime: '', endDate: '', endTime: '',
}

/** COD-118: a University Admin creates an official campus event. */
function CreateEventForm() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof EventFormValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setValues((current) => {
      const next = { ...current, [field]: value }
      // Most events end on the day they start: fill in (or move up) the end date to match.
      if (field === 'startDate' && value && (!current.endDate || current.endDate < value)) next.endDate = value
      return next
    })
    // Clear a field's message as soon as it is edited, and the banner on top once no field has a message left.
    if (errors[field]) {
      const remaining = { ...errors, [field]: undefined }
      setErrors(remaining)
      if (!Object.values(remaining).some(Boolean)) setFormError(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    const found = validateEvent(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Please fix the highlighted fields.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createEvent({
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        startTime: toDate(values.startDate, values.startTime).toISOString(),
        endTime: toDate(values.endDate, values.endTime).toISOString(),
      })
      navigate(`/events?created=${created.id}`)
    } catch (e) {
      if (e instanceof HttpError) {
        setErrors(e.fieldErrors as EventFormErrors)
        setFormError(e.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="event-form-page">
      <p className="events-kicker" lang="en">University Admin</p>
      <h1 className="events-title">Create a campus event</h1>
      <p className="events-sub">Official events appear in every student’s event list right away.</p>

      <form className="event-form" onSubmit={handleSubmit} noValidate>
        {formError && <p className="form-alert" role="alert">{formError}</p>}

        <FormField
          id="title"
          label="Title"
          placeholder="e.g. Spring Career Fair"
          maxLength={LIMITS.title}
          value={values.title}
          onChange={update('title')}
          error={errors.title}
        />

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={5}
            maxLength={LIMITS.description}
            placeholder="What will happen, who it is for, what to bring…"
            value={values.description}
            onChange={update('description')}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? 'description-error description-count' : 'description-count'}
          />
          <p id="description-count" className="form-hint">
            {values.description.length} / {LIMITS.description}
          </p>
          {errors.description && <p id="description-error" className="form-error">{errors.description}</p>}
        </div>

        <div className="event-form-row">
          <FormField
            id="startDate"
            label="Start date"
            type="date"
            min={todayString()}
            value={values.startDate}
            onChange={update('startDate')}
            error={errors.startDate}
          />
          <FormField
            id="startTime"
            label="Start time"
            type="time"
            value={values.startTime}
            onChange={update('startTime')}
            error={errors.startTime}
          />
        </div>
        <div className="event-form-row">
          <FormField
            id="endDate"
            label="End date"
            type="date"
            min={values.startDate || todayString()}
            value={values.endDate}
            onChange={update('endDate')}
            error={errors.endDate}
            hint="Usually the same day. Pick a later day for events that run past midnight or over several days."
          />
          <FormField
            id="endTime"
            label="End time"
            type="time"
            value={values.endTime}
            onChange={update('endTime')}
            error={errors.endTime}
          />
        </div>

        <FormField
          id="location"
          label="Location"
          placeholder="e.g. Kültür ve Kongre Merkezi"
          maxLength={LIMITS.location}
          value={values.location}
          onChange={update('location')}
          error={errors.location}
        />

        <div className="event-form-actions">
          <Link to="/events" className="button">Cancel</Link>
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create event'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateEventForm
