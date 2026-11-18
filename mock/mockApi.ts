import { STATUS_CODES, type IncomingMessage, type ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { authRoutes } from './authMock'
import { eventRoutes } from './eventsMock'
import { ApiError, matchRoute, type Body, type Routes } from './shared'

// Dev-only fake backend, so screens can be built and tested before the real backend is ready.
//
//   npm run dev:mock     -> Vite dev server in mode "mock" with this mock (no backend needed)
//   npm run dev          -> normal dev server, /api is proxied to the real backend
//
// Never part of `npm run build`. Data lives in memory and resets when the dev server restarts.

const routes: Routes = { ...authRoutes, ...eventRoutes }

function readBody(req: IncomingMessage): Promise<Body> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function parseCookies(header: string | undefined) {
  const cookies: Record<string, string> = {}
  for (const part of (header ?? '').split(';')) {
    const index = part.indexOf('=')
    if (index > 0) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim())
  }
  return cookies
}

function send(res: ServerResponse, status: number, body: unknown, contentType = 'application/json') {
  res.statusCode = status
  res.setHeader('Content-Type', contentType)
  res.end(JSON.stringify(body))
}

/** An error response shaped like Spring's ProblemDetail (RFC 9457) plus our `code` / `fieldErrors` members. */
function sendProblem(res: ServerResponse, path: string, status: number, extra: Record<string, unknown>) {
  const problem = { type: 'about:blank', title: STATUS_CODES[status] ?? 'Error', status, instance: path, ...extra }
  send(res, status, problem, 'application/problem+json')
}

export function mockApi(): Plugin {
  return {
    name: 'campushub-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.config.logger.info('\n  [mock] Mock API is on (auth + events). Every verification code is 123456.\n')
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const match = matchRoute(routes, req.method ?? 'GET', path)
        if (!match) return next()
        const auth = req.headers.authorization ?? ''
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

        const setCookies: string[] = []
        const ctx = { cookies: parseCookies(req.headers.cookie), setCookie: (c: string) => setCookies.push(c) }

        await new Promise((r) => setTimeout(r, 300)) // feel like a real network call
        try {
          const result = match.handler(await readBody(req), token, match.params, ctx)
          if (setCookies.length) res.setHeader('Set-Cookie', setCookies)
          if (result === undefined) {
            res.statusCode = 204
            res.end()
          } else {
            send(res, 200, result)
          }
        } catch (error) {
          // e.g. a refused refresh still clears the refresh cookie
          if (setCookies.length) res.setHeader('Set-Cookie', setCookies)
          if (error instanceof ApiError) {
            const fieldErrors = Object.keys(error.fieldErrors).length ? { fieldErrors: error.fieldErrors } : {}
            sendProblem(res, path, error.status, { detail: error.message, code: error.code, ...fieldErrors })
          } else {
            // Like the real backend: no internal details in the response, only in the server log.
            server.config.logger.error(`[mock] ${req.method} ${path} failed: ${String(error)}`)
            sendProblem(res, path, 500, { code: 'INTERNAL_ERROR' })
          }
        }
      })
    },
  }
}
