import { http } from '@/lib/http'
import type {
  AuthSession,
  LoginRequest,
  MessageResponse,
  Profile,
  RegisterRequest,
  RegisterResponse,
  VerifyRequest,
} from '@/features/auth/types'

/** Returns the access token; the server also sets the httpOnly refresh cookie. */
export function login(body: LoginRequest) {
  return http<AuthSession>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

/**
 * Swaps the refresh cookie for a new access token (and a new refresh cookie: rotation).
 * 401 when the session has ended (expired, logged out, or the account is no longer active).
 */
export function refresh() {
  return http<AuthSession>('/api/auth/refresh', { method: 'POST' })
}

/** Ends the session on the server for every device and clears the refresh cookie. */
export function logout() {
  return http<void>('/api/auth/logout', { method: 'POST' })
}

export function register(body: RegisterRequest) {
  return http<RegisterResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) })
}

export function verifyEmail(body: VerifyRequest) {
  return http<MessageResponse>('/api/auth/verify', { method: 'POST', body: JSON.stringify(body) })
}

export function resendCode(email: string) {
  return http<MessageResponse>('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) })
}

/** The signed-in user's profile. */
export function getMe() {
  return http<Profile>('/api/me', undefined, { auth: true })
}
