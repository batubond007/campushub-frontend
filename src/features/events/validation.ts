// Client-side checks for the Create event form (COD-118). The backend checks everything again.

export interface EventFormValues {
  title: string
  description: string
  location: string
  startDate: string // yyyy-mm-dd from <input type="date">
  startTime: string // hh:mm from <input type="time">
  endDate: string // may be a later day: events can run past midnight or over several days
  endTime: string
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>

export const LIMITS = { title: 120, description: 2000, location: 200 } as const

/** Joins a date and a time typed in the student's own time zone into one Date. */
export function toDate(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}

/** Today as yyyy-mm-dd in local time, for the date picker's min. */
export function todayString() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function validateEvent(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {}

  const text = (field: keyof typeof LIMITS, label: string) => {
    const value = values[field].trim()
    if (!value) errors[field] = `Please enter a ${label.toLowerCase()}.`
    else if (value.length > LIMITS[field]) errors[field] = `${label} can be at most ${LIMITS[field]} characters.`
  }
  text('title', 'Title')
  text('description', 'Description')
  text('location', 'Location')

  // yyyy-mm-dd strings compare correctly as text.
  if (!values.startDate) errors.startDate = 'Please choose a start date.'
  else if (values.startDate < todayString()) errors.startDate = 'The start date cannot be in the past.'
  if (!values.startTime) errors.startTime = 'Please choose a start time.'

  if (!values.endDate) errors.endDate = 'Please choose an end date.'
  else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = 'The end date cannot be before the start date.'
  }
  if (!values.endTime) errors.endTime = 'Please choose an end time.'

  if (values.startDate && values.startTime && !errors.startDate) {
    if (toDate(values.startDate, values.startTime).getTime() <= Date.now()) {
      errors.startTime = 'The start time has already passed.'
    }
  }
  const complete = values.startDate && values.startTime && values.endDate && values.endTime
  if (complete && !errors.endDate) {
    if (toDate(values.endDate, values.endTime) <= toDate(values.startDate, values.startTime)) {
      errors.endTime = 'The event must end after it starts.'
    }
  }

  return errors
}

/** Splits an ISO time from the API into the form's local yyyy-mm-dd and hh:mm, for editing an event. */
export function fromIso(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}
