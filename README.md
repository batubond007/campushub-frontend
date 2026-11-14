# CampusHub — Frontend (mock data)

Team Code Cartel · IS 502

CampusHub is a campus events web app: students sign up with their university e-mail, verify it,
set up a profile, and find and join campus events.

This version is **frontend only**. There is no backend or database: every request is answered by a
mock API that runs in the browser (`frontend/src/mock`). Data is stored in `localStorage`, so changes
(new accounts, joined events, role changes) survive a page reload. Use **Reset demo data** on the login
page to go back to the starting data.

| Part | Technology |
|---|---|
| Frontend | React 18 + TypeScript, built to static files with esbuild |
| Data | In-browser mock API + `localStorage` |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

## Run

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Builds, watches for changes and serves the app on http://localhost:3000 |
| `npm run build` | Creates the static files in `dist/` |
| `npm run typecheck` | TypeScript check |

The `dist/` folder can be hosted on any static server (Nginx, GitHub Pages, S3…). Pages use hash URLs
such as `/#/events/5`, so no rewrite rules are needed. `frontend/Dockerfile` builds an Nginx image.

## Demo accounts

| Role | E-mail | Password |
|---|---|---|
| System Admin | `admin@metu.edu.tr` | `ChangeMe2026` |
| Club Manager | `mehmet.kaya@metu.edu.tr` | `Demo1234` |
| University Admin | `zeynep.demir@metu.edu.tr` | `Demo1234` |
| Student | `ayse.yilmaz@metu.edu.tr` | `Demo1234` |

- Sign-up only accepts `@metu.edu.tr` addresses (see `ALLOWED_DOMAINS` in `src/mock/db.ts`).
- No e-mail is sent: the verification code is always **`123456`**.
- `elif.sahin@…` is a disabled account and `burak.celik@…` is waiting for verification, to show those states.

## Features

| Story | Page |
|---|---|
| US-01 · Sign up with university e-mail | `#/register` |
| US-02 · Verify e-mail with OTP (10 min, 5 attempts, 60 s resend cooldown) | `#/verify` |
| US-03 · Log in and log out | `#/login`, “Log out” |
| US-04 · Create and edit profile | `#/profile` |
| US-05 · Manage users and roles (System Admin) | `#/admin/users` |
| US-06 · See campus events and details | `#/events`, `#/events/{id}` |
| US-07 · Join and leave an event | Event page, “Events you joined” on `#/profile` |
| Event creation (Club Manager, System Admin) | `#/events/new` |

## Where things are

| Path | Contents |
|---|---|
| `frontend/src/mock/db.ts` | Seed data (users, events, registrations) and `localStorage` persistence |
| `frontend/src/mock/server.ts` | Mock API routes with the validation and business rules |
| `frontend/src/api.ts` | Types and the `api()` function the pages call |
| `frontend/src/pages/` | Pages |

To connect a real backend later, change `api()` in `src/api.ts` back to a `fetch` call; the pages do not need to change.
