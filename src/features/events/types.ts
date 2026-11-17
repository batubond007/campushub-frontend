// Shapes of the backend's /api/events endpoints.

export interface CampusEvent {
  id: number
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  organizerName: string
  /** Created by a University Admin. */
  official: boolean
  createdAt: string
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface CreateEventRequest {
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
}
