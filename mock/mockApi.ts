import type { IncomingMessage, ServerResponse } from 'node:http'
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

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
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

        await new Promise((r) => setTimeout(r, 300)) // feel like a real network call
        try {
          const result = match.handler(await readBody(req), token, match.params)
          if (result === undefined) {
            res.statusCode = 204
            res.end()
          } else {
            send(res, 200, result)
          }
        } catch (error) {
          if (error instanceof ApiError) {
            send(res, error.status, { status: error.status, message: error.message, fieldErrors: error.fieldErrors })
          } else {
            send(res, 500, { status: 500, message: 'Mock server error.' })
          }
        }
      })
    },
  }
}
