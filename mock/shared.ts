// Small helpers shared by the mock API files.

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly fieldErrors: Record<string, string> = {}) {
    super(message)
  }
}

export type Body = Record<string, unknown>

/** Handlers keyed by "METHOD /path". Return undefined for 204 No Content. */
export type Routes = Record<string, (body: Body, token: string | null) => unknown>
