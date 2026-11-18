import { ApiError, type RequestContext, type Routes } from './shared'

// Mock of the backend's /api/auth and /api/me endpoints (see mock/mockApi.ts for how it is switched on).
// Rules follow the backend contract (US-01, US-02, US-03):
// - Log-in returns a short-lived access token (15 min, sent as `Authorization: Bearer …`) in the body and
//   a refresh token (7 days) in an httpOnly cookie that JavaScript cannot read.
// - POST /api/auth/refresh swaps the refresh cookie for a new access token and a NEW refresh cookie
//   (rotation). Re-using an already used refresh token counts as theft: every session of that user ends.
// - Log-out revokes every refresh token of the user, so the session ends on every device.
// - 6-digit code valid 10 minutes, 5 wrong attempts, 60 s before a new code can be sent.
// No e-mail is sent: every code is MOCK_OTP and is also printed in the terminal.

const MOCK_OTP = '123456'
const OTP_MINUTES = 10
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60_000
const ALLOWED_DOMAINS = ['metu.edu.tr']

type Status = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'
export type Role = 'STUDENT' | 'CLUB_MANAGER' | 'UNIVERSITY_ADMIN' | 'SYSTEM_ADMIN'

export interface MockUser {
  id: number
  email: string
  password: string
  fullName: string
  role: Role
  status: Status
  createdAt: string
  otp: { code: string; expiresAt: number; attempts: number; sentAt: number } | null
}

const users = new Map<string, MockUser>()
let nextId = 1
// To watch the refresh flow in the browser, lower ACCESS_TOKEN_MS to e.g. 30_000 (30 s).
const ACCESS_TOKEN_MS = 15 * 60 * 1000
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000
const REFRESH_COOKIE = 'campushub_refresh'

// Access tokens are checked by expiry only (like a JWT). Refresh tokens are stored, so they can be revoked.
const accessTokens = new Map<string, { email: string; expiresAt: number }>()
const refreshTokens = new Map<string, { email: string; expiresAt: number; used: boolean }>()

const randomToken = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

function setRefreshCookie(ctx: RequestContext, token: string) {
  // Production adds `Secure`; Path keeps the cookie off every request except /api/auth/*.
  ctx.setCookie(
    `${REFRESH_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=${REFRESH_TOKEN_MS / 1000}`,
  )
}

function clearRefreshCookie(ctx: RequestContext) {
  ctx.setCookie(`${REFRESH_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0`)
}

/** Ends every session of a user: all refresh tokens and all access tokens. */
function revokeAll(email: string) {
  for (const [key, t] of refreshTokens) if (t.email === email) refreshTokens.delete(key)
  for (const [key, t] of accessTokens) if (t.email === email) accessTokens.delete(key)
}

/** A new access token in the body and a new refresh token in the cookie. */
function issueTokens(user: MockUser, ctx: RequestContext) {
  const now = Date.now()
  const accessToken = randomToken('access')
  accessTokens.set(accessToken, { email: user.email, expiresAt: now + ACCESS_TOKEN_MS })
  const refreshToken = randomToken('refresh')
  refreshTokens.set(refreshToken, { email: user.email, expiresAt: now + REFRESH_TOKEN_MS, used: false })
  setRefreshCookie(ctx, refreshToken)
  return { accessToken, expiresAt: new Date(now + ACCESS_TOKEN_MS).toISOString(), user: profile(user) }
}

function addUser(email: string, password: string, fullName: string, status: Status, role: Role = 'STUDENT') {
  const user: MockUser = {
    id: nextId++, email, password, fullName, role, status, createdAt: new Date().toISOString(), otp: null,
  }
  users.set(email, user)
  return user
}

// Ready-made accounts for trying the screens.
addUser('ayse.yilmaz@metu.edu.tr', 'Demo1234', 'Ayşe Yılmaz', 'ACTIVE')
// Burak "already got" a code, so 123456 works right away. It never expires and sentAt is 0,
// so "Send a new code" is not blocked by the 60 s cooldown either.
addUser('burak.celik@metu.edu.tr', 'Demo1234', 'Burak Çelik', 'PENDING_VERIFICATION').otp = {
  code: MOCK_OTP, expiresAt: Number.POSITIVE_INFINITY, attempts: 0, sentAt: 0,
}
addUser('zeynep.demir@metu.edu.tr', 'Demo1234', 'Zeynep Demir', 'ACTIVE', 'UNIVERSITY_ADMIN')

const normalize = (email: unknown) => String(email ?? '').trim().toLowerCase()

function isAllowedDomain(email: string) {
  const domain = email.split('@')[1] ?? ''
  return ALLOWED_DOMAINS.includes(domain)
}

function sendCode(user: MockUser) {
  const now = Date.now()
  if (user.otp && now < user.otp.sentAt + RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((user.otp.sentAt + RESEND_COOLDOWN_MS - now) / 1000)
    throw new ApiError(429, 'OTP_COOLDOWN', `Please wait ${wait} seconds before requesting a new code.`)
  }
  user.otp = { code: MOCK_OTP, expiresAt: now + OTP_MINUTES * 60_000, attempts: 0, sentAt: now }
  console.log(`\n  [mock] Verification code for ${user.email}: ${MOCK_OTP}\n`)
}

function pendingUser(rawEmail: unknown) {
  const user = users.get(normalize(rawEmail))
  if (!user) throw new ApiError(400, 'SIGNUP_NOT_FOUND', 'There is no sign-up waiting for this e-mail.')
  if (user.status !== 'PENDING_VERIFICATION') {
    throw new ApiError(409, 'ALREADY_VERIFIED', 'This account is already verified. Please log in.')
  }
  return user
}

function profile(user: MockUser) {
  return {
    id: user.id, email: user.email, fullName: user.fullName, department: null, bio: null, interests: [],
    role: user.role, status: user.status, createdAt: user.createdAt,
  }
}

/** The signed-in user for a Bearer access token, or 401. */
export function userForToken(token: string | null) {
  const session = token ? accessTokens.get(token) : undefined
  const user = session && session.expiresAt > Date.now() ? users.get(session.email) : undefined
  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has ended. Please log in again.')
  }
  return user
}

export const authRoutes: Routes = {
  'POST /api/auth/register': (body) => {
    const email = normalize(body.email)
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '').trim()
    const errors: Record<string, string> = {}
    if (!email) errors.email = 'E-mail is required.'
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must be at least 8 characters with a letter and a number.'
    }
    if (!fullName) errors.fullName = 'Full name is required.'
    if (Object.keys(errors).length) {
      throw new ApiError(400, 'VALIDATION_FAILED', 'Please check the highlighted fields.', errors)
    }
    if (!isAllowedDomain(email)) {
      const detail = `Please sign up with your university e-mail address (@${ALLOWED_DOMAINS.join(', @')}).`
      throw new ApiError(400, 'EMAIL_DOMAIN_NOT_ALLOWED', detail, { email: detail })
    }

    let user = users.get(email)
    if (user && user.status !== 'PENDING_VERIFICATION') {
      throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this e-mail already exists. Please log in.')
    }
    if (!user) user = addUser(email, password, fullName, 'PENDING_VERIFICATION')
    else Object.assign(user, { password, fullName })
    sendCode(user)
    return { email, message: `We sent a verification code to ${email}.`, expiresInMinutes: OTP_MINUTES }
  },

  'POST /api/auth/verify': (body) => {
    const code = String(body.code ?? '')
    if (!/^\d{6}$/.test(code)) {
      throw new ApiError(400, 'VALIDATION_FAILED', 'Please check the highlighted fields.', { code: 'The code has 6 digits.' })
    }
    const user = pendingUser(body.email)
    const otp = user.otp
    const tooMany = 'Too many wrong attempts. Please request a new code.'
    if (!otp) throw new ApiError(400, 'OTP_NOT_FOUND', 'There is no active code. Please request a new one.')
    if (Date.now() > otp.expiresAt) throw new ApiError(400, 'OTP_EXPIRED', 'This code has expired. Please request a new one.')
    if (otp.attempts >= MAX_ATTEMPTS) throw new ApiError(400, 'OTP_TOO_MANY_ATTEMPTS', tooMany)
    if (code !== otp.code) {
      otp.attempts += 1
      const left = MAX_ATTEMPTS - otp.attempts
      if (left <= 0) throw new ApiError(400, 'OTP_TOO_MANY_ATTEMPTS', tooMany)
      throw new ApiError(400, 'OTP_INVALID', `The code is not correct. Attempts left: ${left}.`)
    }
    user.otp = null
    user.status = 'ACTIVE'
    return { message: 'Your e-mail is verified. You can log in now.' }
  },

  'POST /api/auth/resend-otp': (body) => {
    sendCode(pendingUser(body.email))
    return { message: 'We sent a new code.' }
  },

  'POST /api/auth/login': (body, _token, _params, ctx) => {
    const user = users.get(normalize(body.email))
    if (!user || user.password !== String(body.password ?? '')) {
      throw new ApiError(401, 'BAD_CREDENTIALS', 'E-mail or password is incorrect.')
    }
    if (user.status === 'PENDING_VERIFICATION') {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your e-mail address before logging in.')
    }
    if (user.status === 'DISABLED') {
      throw new ApiError(403, 'ACCOUNT_DISABLED', 'This account has been disabled. Please contact the administrator.')
    }
    return issueTokens(user, ctx)
  },

  // Uses only the refresh cookie (no Bearer token), so it also works after the access token expired.
  'POST /api/auth/refresh': (_body, _token, _params, ctx) => {
    const presented = ctx.cookies[REFRESH_COOKIE]
    const stored = presented ? refreshTokens.get(presented) : undefined
    const refuse = (detail: string) => {
      clearRefreshCookie(ctx)
      return new ApiError(401, 'UNAUTHENTICATED', detail)
    }
    if (!stored || stored.expiresAt <= Date.now()) throw refuse('Your session has ended. Please log in again.')
    if (stored.used) {
      // Someone is replaying an old refresh token: treat it as stolen and end every session of the user.
      revokeAll(stored.email)
      throw refuse('Your session has ended for security reasons. Please log in again.')
    }
    const user = users.get(stored.email)
    if (!user || user.status !== 'ACTIVE') throw refuse('Your session has ended. Please log in again.')
    stored.used = true
    return issueTokens(user, ctx)
  },

  // Ends the session on every device. Always succeeds, even without a (valid) cookie.
  'POST /api/auth/logout': (_body, token, _params, ctx) => {
    const fromCookie = refreshTokens.get(ctx.cookies[REFRESH_COOKIE] ?? '')?.email
    const fromAccess = token ? accessTokens.get(token)?.email : undefined
    const email = fromCookie ?? fromAccess
    if (email) revokeAll(email)
    clearRefreshCookie(ctx)
    return undefined
  },

  'GET /api/me': (_body, token) => profile(userForToken(token)),
}
