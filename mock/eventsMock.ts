import { userForToken } from './authMock'
import { ApiError, type Routes } from './shared'

// Mock of the backend's /api/events endpoints (COD-118 create, COD-14 list + details).
// Every signed-in user can list events and open one; only a University Admin can create one.

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
// Ready-made official events (created by University Admins). Descriptions use blank lines between paragraphs.
const events: MockEvent[] = [
  {
    title: 'Welcome Week Campus Tour',
    description:
      'Meet other new students and discover the main campus buildings with student guides.\n\n' +
      'The tour visits the Library, the Cafeteria, the Sports Centre and the faculty buildings, and ends at the ' +
      'Student Centre with tea and simit. Comfortable shoes recommended: the walk takes about two hours.',
    location: 'Main Gate (A1)', startTime: at(2, 10), endTime: at(2, 12), organizerName: 'ODTÜ Student Affairs',
  },
  {
    title: 'Spring Career Fair',
    description:
      'More than 60 companies meet ODTÜ students for internships and graduate positions.\n\n' +
      'Bring printed copies of your CV. The Career Centre will review CVs at its stand between 10:00 and 12:00, ' +
      'and short company talks run in Hall B every hour.',
    location: 'Kültür ve Kongre Merkezi', startTime: at(6, 10), endTime: at(6, 17), organizerName: 'ODTÜ Career Centre',
  },
  {
    title: 'Library Research Skills Workshop',
    description:
      'Learn how to find articles, use the library databases and manage your references for term projects.\n\n' +
      'Bring your laptop. Places are limited to the seminar room capacity.',
    location: 'Library, Seminar Room 2', startTime: at(9, 14), endTime: at(9, 15.5), organizerName: 'ODTÜ Library',
  },
  {
    title: 'Spring Concert: ODTÜ Symphony Orchestra',
    description:
      'The ODTÜ Symphony Orchestra plays Dvořák’s “New World” Symphony and works by Turkish composers.\n\n' +
      'Free entry for students with a student ID. Doors open 30 minutes before the concert.',
    location: 'Kültür ve Kongre Merkezi, Main Hall', startTime: at(4, 19.5), endTime: at(4, 21.5),
    organizerName: 'ODTÜ Culture Office',
  },
  {
    title: 'Mental Health Awareness Talk',
    description:
      'Counsellors from the Medical Centre talk about exam stress, sleep and where to get support on campus.\n\n' +
      'The session is in Turkish with English slides. Questions can be asked anonymously.',
    location: 'Online (link shared with registered students)', startTime: at(12, 17), endTime: at(12, 18),
    organizerName: 'ODTÜ Medical Centre',
  },
  {
    title: 'Orientation Day (past)',
    description: 'This event has already ended, so it does not appear in the upcoming list.',
    location: 'Kültür ve Kongre Merkezi', startTime: at(-3, 10), endTime: at(-3, 16), organizerName: 'ODTÜ Student Affairs',
  },
].map((event) => ({ ...event, id: nextId++, createdAt: new Date().toISOString() }))

function summary(event: MockEvent) {
  return { ...event, official: true }
}

function details(event: MockEvent) {
  return { ...summary(event), ended: Date.parse(event.endTime) <= Date.now() }
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

  'GET /api/events/:id': (_body, token, params) => {
    userForToken(token)
    const event = events.find((e) => e.id === Number(params.id))
    if (!event) throw new ApiError(404, 'NOT_FOUND', 'This event could not be found. It may have been removed.')
    return details(event)
  },

  'POST /api/events': (body, token) => {
    const user = userForToken(token)
    if (user.role !== 'UNIVERSITY_ADMIN') {
      throw new ApiError(403, 'FORBIDDEN', 'Only a University Admin can create campus events.')
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
    if (Object.keys(errors).length) {
      throw new ApiError(400, 'VALIDATION_FAILED', 'Please check the highlighted fields.', errors)
    }

    const event: MockEvent = {
      id: nextId++, title, description, location,
      startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString(),
      organizerName: user.fullName, createdAt: new Date().toISOString(),
    }
    events.push(event)
    return summary(event)
  },
}
