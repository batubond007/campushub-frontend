import { userForToken } from './authMock'
import { ApiError, type Routes } from './shared'

// Mock of the backend's /api/events endpoints (COD-118).
// Every signed-in user can list events; only a University Admin can create one.

interface MockEvent {
  id: number
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  organizerName: string
  createdAt: string
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

// Seed events at sensible local times, a few days from now.
const midnight = new Date()
midnight.setHours(0, 0, 0, 0)
const at = (days: number, hours: number) => new Date(midnight.getTime() + days * DAY + hours * HOUR).toISOString()

let nextId = 1
const events: MockEvent[] = [
  {
    title: 'Welcome Week Campus Tour',
    description: 'Meet other new students and discover the main campus buildings with student guides.',
    location: 'Main Gate (A1)', startTime: at(2, 10), endTime: at(2, 12),
  },
  {
    title: 'Spring Career Fair',
    description: 'More than 60 companies meet ODTÜ students for internships and graduate positions. Bring your CV.',
    location: 'Kültür ve Kongre Merkezi', startTime: at(6, 10), endTime: at(6, 17),
  },
  {
    title: 'Library Research Skills Workshop',
    description: 'Learn how to find articles, use databases and manage your references for term projects.',
    location: 'Library, Seminar Room 2', startTime: at(9, 14), endTime: at(9, 15.5),
  },
].map((event) => ({ ...event, id: nextId++, organizerName: 'ODTÜ Student Affairs', createdAt: new Date().toISOString() }))

function summary(event: MockEvent) {
  return { ...event, official: true }
}

const LIMITS = { title: 120, description: 2000, location: 200 } as const

export const eventRoutes: Routes = {
  'GET /api/events': (_body, token) => {
    userForToken(token)
    const upcoming = events
      .filter((event) => Date.parse(event.endTime) > Date.now())
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
      .map(summary)
    return { content: upcoming, page: 0, size: upcoming.length, totalElements: upcoming.length, totalPages: 1 }
  },

  'POST /api/events': (body, token) => {
    const user = userForToken(token)
    if (user.role !== 'UNIVERSITY_ADMIN') {
      throw new ApiError(403, 'Only a University Admin can create campus events.')
    }

    const errors: Record<string, string> = {}
    const text = (field: keyof typeof LIMITS, label: string) => {
      const value = String(body[field] ?? '').trim()
      if (!value) errors[field] = `${label} is required.`
      else if (value.length > LIMITS[field]) errors[field] = `${label} can be at most ${LIMITS[field]} characters.`
      return value
    }
    const title = text('title', 'Title')
    const description = text('description', 'Description')
    const location = text('location', 'Location')

    const start = Date.parse(String(body.startTime ?? ''))
    const end = Date.parse(String(body.endTime ?? ''))
    if (Number.isNaN(start)) errors.startTime = 'Start time is required.'
    else if (start <= Date.now()) errors.startTime = 'Start time must be in the future.'
    if (Number.isNaN(end)) errors.endTime = 'End time is required.'
    else if (!Number.isNaN(start) && end <= start) errors.endTime = 'End time must be after the start time.'
    if (Object.keys(errors).length) throw new ApiError(400, 'Please check the highlighted fields.', errors)

    const event: MockEvent = {
      id: nextId++, title, description, location,
      startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString(),
      organizerName: user.fullName, createdAt: new Date().toISOString(),
    }
    events.push(event)
    return summary(event)
  },
}
