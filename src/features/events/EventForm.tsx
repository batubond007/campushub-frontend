import { useState, type ChangeEvent, type FormEvent } from 'react'
import { FormField } from '@/components/FormField'
import type { CreateEventRequest } from '@/features/events/types'
import { LIMITS, todayString, toDate, validateEvent, type EventFormErrors, type EventFormValues } from '@/features/events/validation'
import { HttpError } from '@/lib/http'
import { Link } from '@/lib/router'
import '@/features/events/events.css'

export const EMPTY_EVENT: EventFormValues = {
  title: '', description: '', location: '', startDate: '', startTime: '', endDate: '', endTime: '',
}

interface EventFormProps {
  /** Starting values: empty for a new event, the event's current values when editing. */
  initial: EventFormValues
  submitLabel: string
  submittingLabel: string
  /** Where Cancel goes. */
  cancelTo: string
  /** Sends the checked values to the backend. Throw HttpError to show the server's messages on the form. */
  onSubmit: (body: CreateEventRequest) => Promise<void>
}

/**
 * The event fields with their checks, shared by Create event (COD-118) and Edit event (COD-14 fix).
 * Only University Admins reach it; the backend refuses everyone else too.
 */
function EventForm({ initial, submitLabel, submittingLabel, cancelTo, onSubmit }: EventFormProps) {
  const [values, setValues] = useState(initial)
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
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        startTime: toDate(values.startDate, values.startTime).toISOString(),
        endTime: toDate(values.endDate, values.endTime).toISOString(),
      })
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
        <Link to={cancelTo} className="button">Cancel</Link>
        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default EventForm
