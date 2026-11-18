// Small helpers shared by the mock API files.
import type { ErrorCode } from '../src/lib/errorCodes'

/**
 * Thrown by a mock handler; mockApi.ts turns it into a Problem Details body, the same shape as the
 * backend's Spring ProblemDetail: { type, title, status, detail, instance, code, fieldErrors? }.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    detail: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(detail)
  }
}

export type Body = Record<string, unknown>

/**
 * Handlers keyed by "METHOD /path". A path part like ":id" matches any value and is passed in `params`.
 * Return undefined for 204 No Content.
 */
export type Routes = Record<string, (body: Body, token: string | null, params: Record<string, string>) => unknown>

/** Finds the handler for a request, e.g. "GET /api/events/4" matches "GET /api/events/:id". */
export function matchRoute(routes: Routes, method: string, path: string) {
  const parts = path.split('/').filter(Boolean)
  for (const [key, handler] of Object.entries(routes)) {
    const [routeMethod, routePath] = key.split(' ')
    if (routeMethod !== method) continue
    const routeParts = routePath.split('/').filter(Boolean)
    if (routeParts.length !== parts.length) continue
    const params: Record<string, string> = {}
    const ok = routeParts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(parts[i])
        return true
      }
      return part === parts[i]
    })
    if (ok) return { handler, params }
  }
  return null
}
