import { http } from '@/lib/http'
import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
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
