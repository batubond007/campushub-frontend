import { handleMock, MockError } from './mock/server';

export type Role = 'STUDENT' | 'CLUB_MANAGER' | 'UNIVERSITY_ADMIN' | 'SYSTEM_ADMIN';
export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED';

export interface Profile {
  id: number;
  email: string;
  fullName: string;
  department: string | null;
  bio: string | null;
  interests: string[];
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: Profile;
}

export interface EventSummary {
  id: number;
  title: string;
  location: string;
  online: boolean;
  startTime: string;
  endTime: string;
  capacity: number | null;
  participantCount: number;
  full: boolean;
  joined: boolean;
  organizerName: string;
}

export interface EventDetail extends EventSummary {
  description: string;
  ended: boolean;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** Answers every request from the in-browser mock API (src/mock). There is no backend. */
export async function api<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  try {
    return (await handleMock(method, path, body, token ?? null)) as T;
  } catch (error) {
    if (error instanceof MockError) throw new ApiError(error.status, error.message, error.fieldErrors);
    throw new ApiError(500, 'Something went wrong. Please try again.');
  }
}

export const roleLabels: Record<Role, string> = {
  STUDENT: 'Student',
  CLUB_MANAGER: 'Club Manager',
  UNIVERSITY_ADMIN: 'University Admin',
  SYSTEM_ADMIN: 'System Admin',
};
