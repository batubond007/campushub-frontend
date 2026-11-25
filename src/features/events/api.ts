import type { CampusEvent, CreateEventRequest, EventDetail, Page } from '@/features/events/types'
import { http } from '@/lib/http'

// All event calls are made as the signed-in user ({ auth: true }): http() adds the access token
// and refreshes it when needed.

/** One page of upcoming events, soonest first. `page` counts from 0 (like Spring's Pageable). */
export function listEvents(page: number, size: number) {
  return http<Page<CampusEvent>>(`/api/events?page=${page}&size=${size}`, undefined, { auth: true })
}

/** One event with everything the detail page shows (US-06). 404 when it does not exist. */
export function getEvent(id: string) {
  return http<EventDetail>(`/api/events/${encodeURIComponent(id)}`, undefined, { auth: true })
}

/** University Admins only; the backend answers 403 for everyone else. */
export function createEvent(body: CreateEventRequest) {
  return http<CampusEvent>('/api/events', { method: 'POST', body: JSON.stringify(body) }, { auth: true })
}

/** University Admins only: replaces the event's fields. 409 EVENT_ENDED once the event is over. */
export function updateEvent(id: number, body: CreateEventRequest) {
  return http<EventDetail>(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }, { auth: true })
}

/** University Admins only: removes the event for everyone. */
export function deleteEvent(id: number) {
  return http<void>(`/api/events/${id}`, { method: 'DELETE' }, { auth: true })
}
