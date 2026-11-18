import type { CampusEvent, CreateEventRequest, EventDetail, Page } from '@/features/events/types'
import { http } from '@/lib/http'

// All event calls are made as the signed-in user ({ auth: true }): http() adds the access token
// and refreshes it when needed.

/** Upcoming events, soonest first. */
export function listEvents() {
  return http<Page<CampusEvent>>('/api/events?page=0&size=50', undefined, { auth: true })
}

/** One event with everything the detail page shows (US-06). 404 when it does not exist. */
export function getEvent(id: string) {
  return http<EventDetail>(`/api/events/${encodeURIComponent(id)}`, undefined, { auth: true })
}

/** University Admins only; the backend answers 403 for everyone else. */
export function createEvent(body: CreateEventRequest) {
  return http<CampusEvent>('/api/events', { method: 'POST', body: JSON.stringify(body) }, { auth: true })
}
