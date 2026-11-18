import { API_BASE_URL } from '@/lib/env'
import type { ErrorCode } from '@/lib/errorCodes'

/**
 * Error body the backend sends for every non-2xx response: an RFC 9457 Problem Details object
 * (Spring's ProblemDetail, `Content-Type: application/problem+json`) with two extra members:
 * `code` (see errorCodes.ts) and, for validation errors, `fieldErrors` keyed by request field name.
 *
 *   { "type": "about:blank", "title": "Forbidden", "status": 403, "instance": "/api/auth/login",
 *     "detail": "Please verify your e-mail address before logging in.", "code": "EMAIL_NOT_VERIFIED" }
 */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: ErrorCode
  fieldErrors?: Record<string, string>
}

/**
 * Thrown for any non-2xx response, and with status 0 when the server cannot be reached.
 * `message` is the text to show; decide what to do from `status` and `code`, never from the text.
 */
export class HttpError extends Error {
  readonly status: number
  readonly code: ErrorCode | null
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, code: ErrorCode | null = null, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Builds an HttpError from a failed response, whatever its body looks like (JSON, HTML from a proxy, empty). */
async function toHttpError(response: Response): Promise<HttpError> {
  const body: unknown = await response.json().catch(() => null)
  const problem: ProblemDetail = isRecord(body) ? body : {}

  let message: string
  if (typeof problem.detail === 'string' && problem.detail) message = problem.detail
  else if (response.status >= 500) message = 'The CampusHub server is not available right now. Please try again later.'
  else message = `${response.status} ${problem.title ?? response.statusText}`.trim()

  const code = typeof problem.code === 'string' ? problem.code : null
  const fieldErrors = isRecord(problem.fieldErrors) ? (problem.fieldErrors as Record<string, string>) : {}
  return new HttpError(response.status, message, code, fieldErrors)
}

/**
 * How http() gets an access token for signed-in calls. Registered by features/auth/session.ts,
 * so this file does not need to know how sessions work.
 */
export interface AccessTokenSource {
  /** The current access token, or null when there is none or it has (almost) expired. */
  current: () => string | null
  /** Gets a new access token with the refresh cookie; null when the session has ended. */
  refresh: () => Promise<string | null>
}

let tokenSource: AccessTokenSource | null = null

export function setAccessTokenSource(source: AccessTokenSource) {
  tokenSource = source
}

const sessionEnded = () => new HttpError(401, 'Your session has ended. Please log in again.', 'UNAUTHENTICATED')

async function send(path: string, init: RequestInit | undefined, accessToken: string | null): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      // The API is same-origin (/api behind nginx), so the httpOnly refresh cookie is sent by default.
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, application/problem+json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    // Network failure: the server could not be reached at all.
    throw new HttpError(0, 'Could not reach the CampusHub server. Please try again.')
  }
}

/**
 * Thin wrapper around fetch for calling the backend.
 * Each feature's `api.ts` should use this instead of calling fetch directly.
 *
 * With `{ auth: true }` the call is made as the signed-in user: the access token is added, and if it has
 * expired (or the server answers 401) a new one is fetched with the refresh cookie and the call is retried
 * once. If that fails too, the session has ended and an HttpError with status 401 is thrown.
 */
export async function http<T>(path: string, init?: RequestInit, options?: { auth?: boolean }): Promise<T> {
  let response: Response
  if (options?.auth) {
    if (!tokenSource) throw new Error('http(): no access token source registered')
    let token = tokenSource.current() ?? (await tokenSource.refresh())
    if (!token) throw sessionEnded()
    response = await send(path, init, token)
    if (response.status === 401) {
      // Expired or revoked a moment ago: refresh once and try again.
      token = await tokenSource.refresh()
      if (!token) throw sessionEnded()
      response = await send(path, init, token)
    }
  } else {
    response = await send(path, init, null)
  }

  if (!response.ok) throw await toHttpError(response)

  // 204 No Content has no body to parse.
  return (response.status === 204 ? undefined : await response.json()) as T
}
