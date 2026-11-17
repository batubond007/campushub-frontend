import { API_BASE_URL } from '@/lib/env'

/**
 * Thrown for any non-2xx response so callers can inspect the status.
 * When the backend sends its error body (`{ message, fieldErrors }`), those are kept too.
 */
export class HttpError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/**
 * Thin wrapper around fetch for calling the backend.
 * Each feature's `api.ts` should use this instead of calling fetch directly.
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    // Network failure: the server could not be reached at all.
    throw new HttpError(0, 'Could not reach the CampusHub server. Please try again.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    let message = `${response.status} ${response.statusText}`
    if (typeof body?.message === 'string') message = body.message
    else if (response.status >= 500) message = 'The CampusHub server is not available right now. Please try again later.'
    throw new HttpError(response.status, message, body?.fieldErrors ?? {})
  }

  // 204 No Content has no body to parse.
  return (response.status === 204 ? undefined : await response.json()) as T
}
