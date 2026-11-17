// Client-side checks for the Create event form (COD-118). The backend checks everything again.

export interface EventFormValues {
  title: string
  description: string
  location: string
  date: string // yyyy-mm-dd from <input type="date">
  startTime: string // hh:mm from <input type="time">
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

  if (!values.date) errors.date = 'Please choose a date.'
  else if (values.date < todayString()) errors.date = 'The date cannot be in the past.'

  if (!values.startTime) errors.startTime = 'Please choose a start time.'
  if (!values.endTime) errors.endTime = 'Please choose an end time.'

  if (values.date && values.startTime && !errors.date) {
    if (toDate(values.date, values.startTime).getTime() <= Date.now()) {
      errors.startTime = 'The start time has already passed.'
    }
  }
  if (values.startTime && values.endTime && values.endTime <= values.startTime) {
    errors.endTime = 'End time must be after the start time.'
  }

  return errors
}
