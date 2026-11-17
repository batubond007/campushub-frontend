import { http } from '@/lib/http'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/features/auth/types'

export function login(body: LoginRequest) {
  return http<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

export function register(body: RegisterRequest) {
  return http<RegisterResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) })
}
