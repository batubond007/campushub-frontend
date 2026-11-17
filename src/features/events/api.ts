import type { CampusEvent, CreateEventRequest, EventDetail, Page } from '@/features/events/types'
import { http } from '@/lib/http'

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** Upcoming events, soonest first. */
export function listEvents(token: string) {
  return http<Page<CampusEvent>>('/api/events?page=0&size=50', { headers: bearer(token) })
}

/** One event with everything the detail page shows (US-06). 404 when it does not exist. */
export function getEvent(token: string, id: string) {
  return http<EventDetail>(`/api/events/${encodeURIComponent(id)}`, { headers: bearer(token) })
}

/** University Admins only; the backend answers 403 for everyone else. */
export function createEvent(token: string, body: CreateEventRequest) {
  return http<CampusEvent>('/api/events', { method: 'POST', headers: bearer(token), body: JSON.stringify(body) })
}
