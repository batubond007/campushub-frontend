/**
 * Mock API: answers the same paths the old backend served, using the in-browser database.
 * Business rules (validation, roles, join/leave) mirror the original Spring Boot services.
 */
import type { AdminUser, EventDetail, EventSummary, LoginResponse, Page, Profile, Role } from '../api';
import { ALLOWED_DOMAINS, db, DEMO_OTP, EventRow, save, UserRow } from './db';

export class MockError extends Error {
  constructor(public readonly status: number, message: string, public readonly fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

type Body = Record<string, any>;
interface Req { method: string; path: string; query: URLSearchParams; body: Body; token: string | null }

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60_000;
const TOKEN_MS = 2 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (status: number, message: string): never => { throw new MockError(status, message); };
const normalize = (email: unknown) => String(email ?? '').trim().toLowerCase();
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';
const blankToNull = (v: unknown) => (blank(v) ? null : String(v).trim());

function validate(errors: Record<string, string>) {
  if (Object.keys(errors).length) throw new MockError(400, 'Please check the highlighted fields.', errors);
}

function isAllowedDomain(email: string) {
  const domain = email.split('@')[1] ?? '';
  return ALLOWED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function toProfile(u: UserRow): Profile {
  return { id: u.id, email: u.email, fullName: u.fullName, department: u.department, bio: u.bio,
    interests: [...u.interests], role: u.role, status: u.status, createdAt: u.createdAt };
}

function toAdminUser(u: UserRow): AdminUser {
  return { id: u.id, email: u.email, fullName: u.fullName, role: u.role, status: u.status, createdAt: u.createdAt };
}

function participants(eventId: number) {
  return db().registrations.filter((r) => r.eventId === eventId).length;
}

function toSummary(e: EventRow, userId: number): EventSummary {
  const count = participants(e.id);
  const organizer = db().users.find((u) => u.id === e.organizerId);
  return { id: e.id, title: e.title, location: e.location, online: e.online, startTime: e.startTime,
    endTime: e.endTime, capacity: e.capacity, participantCount: count,
    full: e.capacity !== null && count >= e.capacity,
    joined: db().registrations.some((r) => r.eventId === e.id && r.userId === userId),
    organizerName: organizer?.fullName ?? 'Unknown' };
}

function toDetail(e: EventRow, userId: number): EventDetail {
  return { ...toSummary(e, userId), description: e.description, ended: Date.parse(e.endTime) <= Date.now() };
}

function page<T>(items: T[], query: URLSearchParams, maxSize: number): Page<T> {
  const p = Math.max(Number(query.get('page') ?? 0) || 0, 0);
  const size = Math.min(Math.max(Number(query.get('size') ?? 20) || 20, 1), maxSize);
  return { content: items.slice(p * size, p * size + size), page: p, size,
    totalElements: items.length, totalPages: Math.ceil(items.length / size) };
}

function currentUser(req: Req, roles?: Role[]): UserRow {
  const d = db();
  const session = d.sessions.find((s) => s.token === req.token && s.expiresAt > Date.now());
  const user = session && d.users.find((u) => u.id === session.userId && u.status === 'ACTIVE');
  if (!user) fail(401, 'Please log in to continue.');
  if (roles && !roles.includes(user!.role)) fail(403, 'You do not have permission to do this.');
  return user!;
}

function loadEvent(id: number) {
  return db().events.find((e) => e.id === id) ?? fail(404, 'Event not found.');
}

function loadUser(id: number) {
  return db().users.find((u) => u.id === id) ?? fail(404, 'User not found.');
}

function issueOtp(user: UserRow) {
  if (user.otp && Date.now() < user.otp.createdAt + RESEND_COOLDOWN_MS) {
    const wait = Math.max(1, Math.ceil((user.otp.createdAt + RESEND_COOLDOWN_MS - Date.now()) / 1000));
    fail(429, `Please wait ${wait} seconds before requesting a new code.`);
  }
  user.otp = { code: DEMO_OTP, expiresAt: Date.now() + OTP_MINUTES * 60_000, attempts: 0, createdAt: Date.now() };
}

/** Removes every session of a user (logout, role or status change). */
function endSessions(userId: number) {
  const d = db();
  d.sessions = d.sessions.filter((s) => s.userId !== userId);
}

function pendingUser(rawEmail: unknown) {
  const user = db().users.find((u) => u.email === normalize(rawEmail));
  if (!user) fail(400, 'There is no sign-up waiting for this e-mail.');
  if (user!.status !== 'PENDING_VERIFICATION') fail(409, 'This account is already verified. Please log in.');
  return user!;
}

type Handler = (req: Req, params: string[]) => unknown;

const routes: [string, RegExp, Handler][] = [
  ['POST', /^\/api\/auth\/register$/, ({ body }) => {
    const errors: Record<string, string> = {};
    const email = normalize(body.email);
    const password = String(body.password ?? '');
    if (!email) errors.email = 'E-mail is required.';
    else if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid e-mail address.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 8 || password.length > 72) errors.password = 'Password must be 8 to 72 characters.';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Password must contain at least one letter and one number.';
    if (blank(body.fullName)) errors.fullName = 'Full name is required.';
    else if (String(body.fullName).trim().length > 100) errors.fullName = 'Full name can be at most 100 characters.';
    validate(errors);
    if (!isAllowedDomain(email)) fail(400, `Please sign up with your university e-mail address (${ALLOWED_DOMAINS.join(', ')}).`);

    const d = db();
    let user = d.users.find((u) => u.email === email);
    if (user && user.status !== 'PENDING_VERIFICATION') fail(409, 'An account with this e-mail already exists. Please log in.');
    if (!user) {
      user = { id: d.nextUserId++, email, password, fullName: String(body.fullName).trim(), department: null, bio: null,
        interests: [], role: 'STUDENT', status: 'PENDING_VERIFICATION', createdAt: new Date().toISOString(), otp: null };
      d.users.push(user);
    } else {
      user.password = password;
      user.fullName = String(body.fullName).trim();
    }
    issueOtp(user);
    return { email, message: `We sent a verification code to ${email}.`, expiresInMinutes: OTP_MINUTES };
  }],

  ['POST', /^\/api\/auth\/verify$/, ({ body }) => {
    const errors: Record<string, string> = {};
    if (blank(body.email)) errors.email = 'E-mail is required.';
    if (blank(body.code)) errors.code = 'Code is required.';
    else if (!/^\d{4,8}$/.test(String(body.code))) errors.code = 'The code contains digits only.';
    validate(errors);
    const user = pendingUser(body.email);
    const otp = user.otp ?? fail(400, 'There is no active code. Please request a new one.');
    if (Date.now() > otp.expiresAt) fail(400, 'This code has expired. Please request a new one.');
    if (otp.attempts >= OTP_MAX_ATTEMPTS) fail(400, 'Too many wrong attempts. Please request a new code.');
    if (otp.code !== String(body.code)) {
      otp.attempts += 1;
      save();
      fail(400, `The code is not correct. Attempts left: ${Math.max(0, OTP_MAX_ATTEMPTS - otp.attempts)}.`);
    }
    user.otp = null;
    user.status = 'ACTIVE';
    return { message: 'Your account is verified.' };
  }],

  ['POST', /^\/api\/auth\/resend-otp$/, ({ body }) => {
    issueOtp(pendingUser(body.email));
    return { message: 'We sent a new code.' };
  }],

  ['POST', /^\/api\/auth\/login$/, ({ body }): LoginResponse => {
    const user = db().users.find((u) => u.email === normalize(body.email) && u.password === String(body.password ?? ''));
    if (!user) fail(401, 'E-mail or password is incorrect.');
    if (user!.status === 'PENDING_VERIFICATION') fail(403, 'Please verify your e-mail address before logging in.');
    if (user!.status === 'DISABLED') fail(403, 'This account has been disabled. Please contact the administrator.');
    const token = `mock-${user!.id}-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const expiresAt = Date.now() + TOKEN_MS;
    db().sessions.push({ token, userId: user!.id, expiresAt });
    return { token, expiresAt: new Date(expiresAt).toISOString(), user: toProfile(user!) };
  }],

  ['POST', /^\/api\/auth\/logout$/, (req) => {
    endSessions(currentUser(req).id);
    return undefined;
  }],

  ['GET', /^\/api\/me$/, (req) => toProfile(currentUser(req))],

  ['PUT', /^\/api\/me$/, (req) => {
    const user = currentUser(req);
    const { body } = req;
    const errors: Record<string, string> = {};
    if (blank(body.fullName)) errors.fullName = 'Full name is required.';
    else if (String(body.fullName).trim().length > 100) errors.fullName = 'Full name can be at most 100 characters.';
    if (String(body.department ?? '').length > 100) errors.department = 'Department can be at most 100 characters.';
    if (String(body.bio ?? '').length > 500) errors.bio = 'Bio can be at most 500 characters.';
    const interests: string[] = Array.isArray(body.interests) ? body.interests.map((i: unknown) => String(i ?? '').trim()) : [];
    if (interests.length > 10) errors.interests = 'You can add up to 10 interests.';
    else if (interests.some((i) => i.length > 40)) errors.interests = 'Each interest can be at most 40 characters.';
    validate(errors);
    user.fullName = String(body.fullName).trim();
    user.department = blankToNull(body.department);
    user.bio = blankToNull(body.bio);
    user.interests = [...new Set(interests.filter(Boolean))];
    return toProfile(user);
  }],

  ['GET', /^\/api\/me\/events$/, (req) => {
    const user = currentUser(req);
    const ids = new Set(db().registrations.filter((r) => r.userId === user.id).map((r) => r.eventId));
    return db().events
      .filter((e) => ids.has(e.id) && Date.parse(e.endTime) > Date.now())
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
      .map((e) => toSummary(e, user.id));
  }],

  ['GET', /^\/api\/events$/, (req) => {
    const user = currentUser(req);
    const upcoming = db().events
      .filter((e) => Date.parse(e.endTime) > Date.now())
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
      .map((e) => toSummary(e, user.id));
    return page(upcoming, req.query, 50);
  }],

  ['POST', /^\/api\/events$/, (req) => {
    const user = currentUser(req, ['CLUB_MANAGER', 'SYSTEM_ADMIN']);
    const { body } = req;
    const errors: Record<string, string> = {};
    const req120 = (field: string, label: string, max: number) => {
      if (blank(body[field])) errors[field] = `${label} is required.`;
      else if (String(body[field]).trim().length > max) errors[field] = `${label} can be at most ${max} characters.`;
    };
    req120('title', 'Title', 120);
    req120('description', 'Description', 2000);
    req120('location', 'Location', 200);
    const start = Date.parse(body.startTime);
    const end = Date.parse(body.endTime);
    if (blank(body.startTime) || Number.isNaN(start)) errors.startTime = 'Start time is required.';
    else if (start <= Date.now()) errors.startTime = 'Start time must be in the future.';
    if (blank(body.endTime) || Number.isNaN(end)) errors.endTime = 'End time is required.';
    validate(errors);
    if (end <= start) fail(400, 'End time must be after the start time.');
    const d = db();
    const event: EventRow = { id: d.nextEventId++, title: String(body.title).trim(), description: String(body.description).trim(),
      location: String(body.location).trim(), online: Boolean(body.online), startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(), capacity: null, organizerId: user.id };
    d.events.push(event);
    return toDetail(event, user.id);
  }],

  ['GET', /^\/api\/events\/(\d+)$/, (req, [id]) => toDetail(loadEvent(Number(id)), currentUser(req).id)],

  ['POST', /^\/api\/events\/(\d+)\/registration$/, (req, [id]) => {
    const user = currentUser(req);
    const event = loadEvent(Number(id));
    const d = db();
    if (Date.parse(event.endTime) <= Date.now()) fail(400, 'This event has already ended.');
    if (d.registrations.some((r) => r.eventId === event.id && r.userId === user.id)) fail(409, 'You have already joined this event.');
    if (event.capacity !== null && participants(event.id) >= event.capacity) fail(409, 'This event is full.');
    d.registrations.push({ eventId: event.id, userId: user.id });
    return toDetail(event, user.id);
  }],

  ['DELETE', /^\/api\/events\/(\d+)\/registration$/, (req, [id]) => {
    const user = currentUser(req);
    const event = loadEvent(Number(id));
    const d = db();
    const index = d.registrations.findIndex((r) => r.eventId === event.id && r.userId === user.id);
    if (index < 0) fail(404, 'You have not joined this event.');
    if (Date.parse(event.startTime) <= Date.now()) fail(400, 'You cannot leave an event that has already started.');
    d.registrations.splice(index, 1);
    return toDetail(event, user.id);
  }],

  ['GET', /^\/api\/admin\/users$/, (req) => {
    currentUser(req, ['SYSTEM_ADMIN']);
    const q = (req.query.get('query') ?? '').trim().toLowerCase();
    const users = db().users
      .filter((u) => !q || u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(toAdminUser);
    return page(users, req.query, 100);
  }],

  ['PUT', /^\/api\/admin\/users\/(\d+)\/role$/, (req, [id]) => {
    const admin = currentUser(req, ['SYSTEM_ADMIN']);
    const roles: Role[] = ['STUDENT', 'CLUB_MANAGER', 'UNIVERSITY_ADMIN', 'SYSTEM_ADMIN'];
    if (!roles.includes(req.body.role)) validate({ role: 'Role is required.' });
    if (admin.id === Number(id)) fail(400, 'You cannot change your own role.');
    const user = loadUser(Number(id));
    user.role = req.body.role;
    endSessions(user.id);
    return toAdminUser(user);
  }],

  ['PUT', /^\/api\/admin\/users\/(\d+)\/status$/, (req, [id]) => {
    const admin = currentUser(req, ['SYSTEM_ADMIN']);
    const status = req.body.status;
    if (!['ACTIVE', 'DISABLED', 'PENDING_VERIFICATION'].includes(status)) validate({ status: 'Status is required.' });
    if (admin.id === Number(id)) fail(400, 'You cannot change the status of your own account.');
    if (status === 'PENDING_VERIFICATION') fail(400, 'Status can only be set to ACTIVE or DISABLED.');
    const user = loadUser(Number(id));
    if (user.status === 'PENDING_VERIFICATION' && status === 'ACTIVE') fail(400, 'This user has not verified their e-mail yet.');
    user.status = status;
    endSessions(user.id);
    return toAdminUser(user);
  }],
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function handleMock(method: string, url: string, body: unknown, token: string | null): Promise<unknown> {
  await delay(150 + Math.random() * 200); // feel like a real network call
  const [path, search = ''] = url.split('?');
  const req: Req = { method, path, query: new URLSearchParams(search), body: (body ?? {}) as Body, token };
  for (const [m, pattern, handler] of routes) {
    const match = pattern.exec(path);
    if (m === method && match) {
      const result = handler(req, match.slice(1));
      save();
      // Return a copy so pages can never mutate the mock database directly.
      return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
    }
  }
  throw new MockError(404, 'Not found.');
}
