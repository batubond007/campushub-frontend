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

export interface LoginResponse {
  token: string
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
