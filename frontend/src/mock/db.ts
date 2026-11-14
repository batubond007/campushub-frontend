/**
 * In-browser mock database. Replaces the old Spring Boot backend.
 * Data is kept in localStorage so changes survive a page reload; "Reset demo data" clears it.
 */
import type { AccountStatus, Role } from '../api';

export interface UserRow {
  id: number;
  email: string;
  password: string;
  fullName: string;
  department: string | null;
  bio: string | null;
  interests: string[];
  role: Role;
  status: AccountStatus;
  createdAt: string;
  otp: { code: string; expiresAt: number; attempts: number; createdAt: number } | null;
}

export interface EventRow {
  id: number;
  title: string;
  description: string;
  location: string;
  online: boolean;
  startTime: string;
  endTime: string;
  capacity: number | null;
  organizerId: number;
}

export interface RegistrationRow {
  eventId: number;
  userId: number;
}

export interface SessionRow {
  token: string;
  userId: number;
  expiresAt: number;
}

export interface Db {
  users: UserRow[];
  events: EventRow[];
  registrations: RegistrationRow[];
  sessions: SessionRow[];
  nextUserId: number;
  nextEventId: number;
}

/** Every mock verification code is this value, so the demo works without e-mail. */
export const DEMO_OTP = '123456';
export const ALLOWED_DOMAINS = ['metu.edu.tr'];

const STORAGE_KEY = 'campushub.mockdb.v1';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function seed(): Db {
  const now = Date.now();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const base = midnight.getTime(); // events are placed at local times of day
  const at = (ms: number) => new Date(base + ms).toISOString();
  const created = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();

  const user = (id: number, email: string, fullName: string, role: Role, extra: Partial<UserRow> = {}): UserRow => ({
    id, email, password: 'Demo1234', fullName, department: null, bio: null, interests: [],
    role, status: 'ACTIVE', createdAt: created(30 - id), otp: null, ...extra,
  });

  const users: UserRow[] = [
    user(1, 'admin@metu.edu.tr', 'System Admin', 'SYSTEM_ADMIN', { password: 'ChangeMe2026' }),
    user(2, 'ayse.yilmaz@metu.edu.tr', 'Ayşe Yılmaz', 'STUDENT', {
      department: 'Computer Engineering', bio: 'Third-year student, loves hackathons and hiking.',
      interests: ['Programming', 'Hiking', 'Photography'],
    }),
    user(3, 'mehmet.kaya@metu.edu.tr', 'Mehmet Kaya', 'CLUB_MANAGER', {
      department: 'Electrical Engineering', bio: 'President of the Robotics Club.', interests: ['Robotics', 'Arduino'],
    }),
    user(4, 'zeynep.demir@metu.edu.tr', 'Zeynep Demir', 'UNIVERSITY_ADMIN', { department: 'Student Affairs' }),
    user(5, 'can.ozturk@metu.edu.tr', 'Can Öztürk', 'STUDENT', { department: 'Architecture', interests: ['Design'] }),
    user(6, 'elif.sahin@metu.edu.tr', 'Elif Şahin', 'STUDENT', { status: 'DISABLED' }),
    user(7, 'burak.celik@metu.edu.tr', 'Burak Çelik', 'STUDENT', { status: 'PENDING_VERIFICATION' }),
  ];

  const events: EventRow[] = [
    { id: 1, title: 'Welcome Week Campus Tour', description: 'Meet other new students and discover the main campus buildings.',
      location: 'Main Gate', online: false, startTime: at(2 * DAY + 10 * HOUR), endTime: at(2 * DAY + 12 * HOUR), capacity: null, organizerId: 1 },
    { id: 2, title: 'Intro to Git Workshop', description: 'A hands-on session on branches, commits and pull requests. Bring your laptop.',
      location: 'Computer Engineering Lab 2', online: false, startTime: at(5 * DAY + 14 * HOUR), endTime: at(5 * DAY + 15.5 * HOUR), capacity: 30, organizerId: 3 },
    { id: 3, title: 'Career Talk: Working in Tech', description: 'Alumni share how they found their first job. Questions are welcome.',
      location: 'Online (link shared with participants)', online: true, startTime: at(9 * DAY + 17 * HOUR), endTime: at(9 * DAY + 18 * HOUR), capacity: null, organizerId: 1 },
    { id: 4, title: 'Robotics Club Build Night', description: 'Work on this term’s line-following robot with the team. Pizza included.',
      location: 'EE Building, Room B-104', online: false, startTime: at(3 * DAY + 18 * HOUR), endTime: at(3 * DAY + 21 * HOUR), capacity: 3, organizerId: 3 },
    { id: 5, title: 'Photography Walk', description: 'An evening walk around the lake to practise night photography.',
      location: 'Eymir Lake entrance', online: false, startTime: at(12 * DAY + 19 * HOUR), endTime: at(12 * DAY + 22 * HOUR), capacity: 15, organizerId: 3 },
    { id: 6, title: 'Study Skills Webinar', description: 'Tips for planning the exam period, from the Student Affairs office.',
      location: 'Online (Zoom)', online: true, startTime: at(16 * DAY + 13 * HOUR), endTime: at(16 * DAY + 14 * HOUR), capacity: null, organizerId: 4 },
  ];

  const registrations: RegistrationRow[] = [
    { eventId: 2, userId: 2 }, { eventId: 2, userId: 5 },
    { eventId: 4, userId: 2 }, { eventId: 4, userId: 3 }, { eventId: 4, userId: 5 },
    { eventId: 1, userId: 5 },
  ];

  return { users, events, registrations, sessions: [], nextUserId: 8, nextEventId: 7 };
}

let cache: Db | null = null;

export function db(): Db {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) cache = JSON.parse(raw) as Db;
  } catch {
    // Storage unavailable or corrupt: fall back to fresh seed data.
  }
  if (!cache) cache = seed();
  return cache;
}

export function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db()));
  } catch {
    // Storage unavailable: data lasts until the page closes.
  }
}

export function resetDb() {
  cache = seed();
  save();
}
