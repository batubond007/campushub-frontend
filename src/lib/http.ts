import { API_BASE_URL } from '@/lib/env'

/** Thrown for any non-2xx response so callers can inspect the status. */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * Thin wrapper around fetch for calling the backend.
 * Each feature's `api.ts` should use this instead of calling fetch directly.
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new HttpError(response.status, `${response.status} ${response.statusText}`)
  }

  // 204 No Content has no body to parse.
  return (response.status === 204 ? undefined : await response.json()) as T
}
