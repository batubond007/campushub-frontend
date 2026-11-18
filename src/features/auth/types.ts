// Shapes of the backend's /api/auth endpoints.

export type Role = 'STUDENT' | 'CLUB_MANAGER' | 'UNIVERSITY_ADMIN' | 'SYSTEM_ADMIN'
export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED'

export interface Profile {
  id: number
  email: string
  fullName: string
  department: string | null
  bio: string | null
  interests: string[]
  role: Role
  status: AccountStatus
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

/**
 * Answer of POST /api/auth/login and POST /api/auth/refresh.
 * The refresh token is NOT here: the server sets it as an httpOnly cookie that JavaScript cannot read.
 */
export interface AuthSession {
  /** Short-lived (about 15 min); sent as `Authorization: Bearer …`. Kept in memory only. */
  accessToken: string
  /** When the access token stops working (ISO 8601). */
  expiresAt: string
  user: Profile
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface RegisterResponse {
  email: string
  message: string
  expiresInMinutes: number
}

export interface VerifyRequest {
  email: string
  code: string
}

export interface MessageResponse {
  message: string
}
