import { http } from '@/lib/http'
import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
  Profile,
  RegisterRequest,
  RegisterResponse,
  VerifyRequest,
} from '@/features/auth/types'

export function login(body: LoginRequest) {
  return http<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })
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

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** The signed-in user's profile. Fails with 401 when the token is no longer valid. */
export function getMe(token: string) {
  return http<Profile>('/api/me', { headers: bearer(token) })
}

/** Ends the session on the server (all of this user's tokens stop working). */
export function logout(token: string) {
  return http<void>('/api/auth/logout', { method: 'POST', headers: bearer(token) })
}
