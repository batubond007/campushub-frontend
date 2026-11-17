import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

// Dev-only mock of the backend's /api/auth endpoints, so the sign-up → verify → log-in flow
// can be built and tested before the real backend is ready.
//
//   npm run dev:mock     -> Vite dev server in mode "mock" with this mock (no backend needed)
//   npm run dev          -> normal dev server, /api is proxied to the real backend
//
// Never part of `npm run build`. Rules follow the backend contract (US-01, US-02, US-03):
// 6-digit code valid 10 minutes, 5 wrong attempts, 60 s before a new code can be sent.
// No e-mail is sent: every code is MOCK_OTP and is also printed in the terminal.

const MOCK_OTP = '123456'
const OTP_MINUTES = 10
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60_000
const ALLOWED_DOMAINS = ['metu.edu.tr']

type Status = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'

interface MockUser {
  id: number
  email: string
  password: string
  fullName: string
  status: Status
  createdAt: string
  otp: { code: string; expiresAt: number; attempts: number; sentAt: number } | null
}

const users = new Map<string, MockUser>()
let nextId = 1

function addUser(email: string, password: string, fullName: string, status: Status) {
  const user: MockUser = { id: nextId++, email, password, fullName, status, createdAt: new Date().toISOString(), otp: null }
  users.set(email, user)
  return user
}

// Ready-made accounts for trying the screens.
addUser('ayse.yilmaz@metu.edu.tr', 'Demo1234', 'Ayşe Yılmaz', 'ACTIVE')
addUser('burak.celik@metu.edu.tr', 'Demo1234', 'Burak Çelik', 'PENDING_VERIFICATION')

class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly fieldErrors: Record<string, string> = {}) {
    super(message)
  }
}

const normalize = (email: unknown) => String(email ?? '').trim().toLowerCase()

function isAllowedDomain(email: string) {
  const domain = email.split('@')[1] ?? ''
  return ALLOWED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
}

function sendCode(user: MockUser) {
  const now = Date.now()
  if (user.otp && now < user.otp.sentAt + RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((user.otp.sentAt + RESEND_COOLDOWN_MS - now) / 1000)
    throw new ApiError(429, `Please wait ${wait} seconds before requesting a new code.`)
  }
  user.otp = { code: MOCK_OTP, expiresAt: now + OTP_MINUTES * 60_000, attempts: 0, sentAt: now }
  console.log(`\n  [mock] Verification code for ${user.email}: ${MOCK_OTP}\n`)
}

function pendingUser(rawEmail: unknown) {
  const user = users.get(normalize(rawEmail))
  if (!user) throw new ApiError(400, 'There is no sign-up waiting for this e-mail.')
  if (user.status !== 'PENDING_VERIFICATION') throw new ApiError(409, 'This account is already verified. Please log in.')
  return user
}

function profile(user: MockUser) {
  return {
    id: user.id, email: user.email, fullName: user.fullName, department: null, bio: null, interests: [],
    role: 'STUDENT', status: user.status, createdAt: user.createdAt,
  }
}

type Body = Record<string, unknown>

const routes: Record<string, (body: Body) => unknown> = {
  '/api/auth/register': (body) => {
    const email = normalize(body.email)
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '').trim()
    const errors: Record<string, string> = {}
    if (!email) errors.email = 'E-mail is required.'
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must be at least 8 characters with a letter and a number.'
    }
    if (!fullName) errors.fullName = 'Full name is required.'
    if (Object.keys(errors).length) throw new ApiError(400, 'Please check the highlighted fields.', errors)
    if (!isAllowedDomain(email)) {
      throw new ApiError(400, `Please sign up with your university e-mail address (${ALLOWED_DOMAINS.join(', ')}).`)
    }

    let user = users.get(email)
    if (user && user.status !== 'PENDING_VERIFICATION') {
      throw new ApiError(409, 'An account with this e-mail already exists. Please log in.')
    }
    if (!user) user = addUser(email, password, fullName, 'PENDING_VERIFICATION')
    else Object.assign(user, { password, fullName })
    sendCode(user)
    return { email, message: `We sent a verification code to ${email}.`, expiresInMinutes: OTP_MINUTES }
  },

  '/api/auth/verify': (body) => {
    const code = String(body.code ?? '')
    if (!/^\d{6}$/.test(code)) {
      throw new ApiError(400, 'Please check the highlighted fields.', { code: 'The code has 6 digits.' })
    }
    const user = pendingUser(body.email)
    const otp = user.otp
    if (!otp) throw new ApiError(400, 'There is no active code. Please request a new one.')
    if (Date.now() > otp.expiresAt) throw new ApiError(400, 'This code has expired. Please request a new one.')
    if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(400, 'Too many wrong attempts. Please request a new code.')
    if (code !== otp.code) {
      otp.attempts += 1
      const left = MAX_ATTEMPTS - otp.attempts
      throw new ApiError(400, left > 0
        ? `The code is not correct. Attempts left: ${left}.`
        : 'Too many wrong attempts. Please request a new code.')
    }
    user.otp = null
    user.status = 'ACTIVE'
    return { message: 'Your e-mail is verified. You can log in now.' }
  },

  '/api/auth/resend-otp': (body) => {
    sendCode(pendingUser(body.email))
    return { message: 'We sent a new code.' }
  },

  '/api/auth/login': (body) => {
    const user = users.get(normalize(body.email))
    if (!user || user.password !== String(body.password ?? '')) {
      throw new ApiError(401, 'E-mail or password is incorrect.')
    }
    if (user.status === 'PENDING_VERIFICATION') {
      throw new ApiError(403, 'Please verify your e-mail address before logging in.')
    }
    if (user.status === 'DISABLED') {
      throw new ApiError(403, 'This account has been disabled. Please contact the administrator.')
    }
    return { token: `mock-token-${user.id}`, expiresAt: new Date(Date.now() + 2 * 3600_000).toISOString(), user: profile(user) }
  },
}

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

export function authMock(): Plugin {
  return {
    name: 'campushub-auth-mock',
    apply: 'serve',
    configureServer(server) {
      server.config.logger.info('\n  [mock] Auth API mock is on. Every verification code is 123456.\n')
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const handler = routes[path]
        if (!handler || req.method !== 'POST') return next()

        await new Promise((r) => setTimeout(r, 300)) // feel like a real network call
        try {
          send(res, 200, handler(await readBody(req)))
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
