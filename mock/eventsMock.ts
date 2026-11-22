import { userForToken } from './authMock'
import { ApiError, type Routes } from './shared'

// Mock of the backend's /api/events endpoints (COD-118 create, COD-14 list + details, edit + delete).
// Every signed-in user can list events and open one; only a University Admin can create, edit or delete one.

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
    title: 'ODTÜ Spring Festival',
    description:
      'Three days of concerts, club stands and food trucks on the Devrim Stadium grounds.\n\n' +
      'Concerts run until late every night; the festival area opens at 12:00 each day.',
    location: 'Devrim Stadium', startTime: at(15, 12), endTime: at(17, 23.5), organizerName: 'ODTÜ Culture Office',
  },
  {
    title: 'Hackathon: Campus Apps',
    description:
      'A 24-hour hackathon: build an app that makes campus life easier. Teams of 2–4, mentors on site all night.\n\n' +
      'Food and drinks are provided. Bring your laptop and charger.',
    location: 'Computer Engineering Building, A101', startTime: at(20, 18), endTime: at(21, 18),
    organizerName: 'ODTÜ Computer Engineering',
  },
  // A few more, so the list has several pages to try paging with.
  ...[
    ['Chess Tournament', 'Student Centre, Room 3', 3, 13, 17],
    ['Photography Walk', 'Eymir Lake', 5, 9, 12],
    ['Startup Pitch Night', 'Technopolis, Hall 1', 7, 18, 21],
    ['Blood Donation Day', 'Medical Centre', 8, 10, 16],
    ['Debate Club Open Session', 'Faculty of Arts, Room 210', 10, 17, 19],
    ['Robotics Demo Day', 'Mechanical Engineering, Hangar', 11, 13, 17],
    ['Turkish Folk Dance Show', 'Kültür ve Kongre Merkezi, Main Hall', 13, 19, 21],
    ['Climbing Wall Taster', 'Sports Centre', 14, 15, 17],
    ['Data Science Meetup', 'Library, Seminar Room 1', 16, 18, 20],
    ['Campus Clean-up', 'Main Gate (A1)', 18, 10, 13],
    ['Film Night: Classic Turkish Cinema', 'Faculty of Architecture, Auditorium', 19, 20, 22.5],
    ['Graduate Study Abroad Info Session', 'Online (link shared with registered students)', 22, 14, 15],
  ].map(([title, location, day, from, to]) => ({
    title: String(title),
    description: `${title} at ${location}. Open to all ODTÜ students.`,
    location: String(location),
    startTime: at(Number(day), Number(from)),
    endTime: at(Number(day), Number(to)),
    organizerName: 'ODTÜ Student Affairs',
  })),
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

function findEvent(id: string) {
  const event = events.find((e) => e.id === Number(id))
  if (!event) throw new ApiError(404, 'NOT_FOUND', 'This event could not be found. It may have been removed.')
  return event
}

/** Only a University Admin may create, edit or delete campus events. */
function requireUniversityAdmin(token: string | null, action: 'create' | 'edit' | 'delete') {
  const user = userForToken(token)
  if (user.role !== 'UNIVERSITY_ADMIN') {
    throw new ApiError(403, 'FORBIDDEN', `Only a University Admin can ${action} campus events.`)
  }
  return user
}

/** Checks the body of a create or edit request, the same way for both. */
function readEventBody(body: Record<string, unknown>) {
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
  return { title, description, location, startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString() }
}
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

export const eventRoutes: Routes = {
  // ?page= counts from 0 and ?size= is 1–50 (defaults 0 and 10), like Spring's Pageable.
  // A page past the end is not an error: it just has no content.
  'GET /api/events': (_body, token, _params, ctx) => {
    userForToken(token)
    const rawPage = ctx.query.get('page') ?? '0'
    const rawSize = ctx.query.get('size') ?? String(DEFAULT_PAGE_SIZE)
    const page = Number(rawPage)
    const size = Number(rawSize)
    const errors: Record<string, string> = {}
    if (!Number.isInteger(page) || page < 0) errors.page = 'page must be a whole number, 0 or more.'
    if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) {
      errors.size = `size must be a whole number from 1 to ${MAX_PAGE_SIZE}.`
    }
    if (Object.keys(errors).length) throw new ApiError(400, 'VALIDATION_FAILED', 'Invalid paging parameters.', errors)

    const upcoming = events
      .filter((event) => Date.parse(event.endTime) > Date.now())
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    return {
      content: upcoming.slice(page * size, page * size + size).map(summary),
      page,
      size,
      totalElements: upcoming.length,
      totalPages: Math.ceil(upcoming.length / size),
    }
  },

  'GET /api/events/:id': (_body, token, params) => {
    userForToken(token)
    return details(findEvent(params.id))
  },

  'POST /api/events': (body, token) => {
    const user = requireUniversityAdmin(token, 'create')
    const fields = readEventBody(body)
    const event: MockEvent = { id: nextId++, ...fields, organizerName: user.fullName, createdAt: new Date().toISOString() }
    events.push(event)
    return summary(event)
  },

  // Edit an event (all fields are sent again). The organizer stays the original one.
  'PUT /api/events/:id': (body, token, params) => {
    requireUniversityAdmin(token, 'edit')
    const event = findEvent(params.id)
    if (Date.parse(event.endTime) <= Date.now()) {
      throw new ApiError(409, 'EVENT_ENDED', 'This event has already ended and can no longer be edited.')
    }
    Object.assign(event, readEventBody(body))
    return details(event)
  },

  'DELETE /api/events/:id': (_body, token, params) => {
    requireUniversityAdmin(token, 'delete')
    const event = findEvent(params.id)
    events.splice(events.indexOf(event), 1)
    return undefined
  },
}
