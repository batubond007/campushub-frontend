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
        Accept: 'application/json, application/problem+json',
        ...init?.headers,
      },
    })
  } catch {
    // Network failure: the server could not be reached at all.
    throw new HttpError(0, 'Could not reach the CampusHub server. Please try again.')
  }

  if (!response.ok) throw await toHttpError(response)

  // 204 No Content has no body to parse.
  return (response.status === 204 ? undefined : await response.json()) as T
}
