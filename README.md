# CampusHub Frontend

Static React (Vite + TypeScript) single-page app.

## Mock accounts
Only with `npm run dev:mock` (see "Without the backend" below). Password for all: `Demo1234`.

| E-mail                     | Account                                   |
|----------------------------|-------------------------------------------|
| `ayse.yilmaz@metu.edu.tr`  | Verified student                          |
| `burak.celik@metu.edu.tr`  | Not verified yet: log in, then verify     |
| `zeynep.demir@metu.edu.tr` | University Admin (can create events)      |

Verification code: `123456`.

## Visuals
<img width="1612" height="1074" alt="18 Robotics Demo Day" src="https://github.com/user-attachments/assets/a7f9c14a-e3d5-4e4b-b151-6ca4dff68b6f" />



## Requirements
- Node.js 22 (see `.nvmrc`; minimum 20.19)

## Development
```bash
npm install
npm run dev        # http://localhost:5173
```
Requests to `/api/*` are proxied to the backend at `http://localhost:8080` (see `vite.config.ts`).

### Without the backend (mock API)
```bash
npm run dev:mock   # http://localhost:5173, /api/* answered by the mock in mock/
```
The mock covers sign-up, e-mail verification (OTP), resending the code, log-in, log-out, `GET /api/me`,
listing events, event details and creating events (University Admin only), with the same rules
as the backend (6-digit code, valid 10 minutes, 5 attempts, 60 s before a new code). No e-mail is sent:
the code is always **`123456`** and is also printed in the terminal. Data lives in memory and resets when
the dev server restarts. Ready-made accounts (password `Demo1234`): `ayse.yilmaz@metu.edu.tr` (verified student),
`burak.celik@metu.edu.tr` (waiting for verification) and `zeynep.demir@metu.edu.tr` (University Admin). The mock is never part of `npm run build`.

## Project structure
Code is grouped by feature (events, clubs, auth, ...). Import with the `@/` alias (`@/lib/http`), not `../../`.

```
src/
├── main.tsx        # Entry point: mounts <App />
├── App.tsx         # Root component
├── index.css       # Global styles
├── pages/          # One component per screen (EventsPage.tsx, ClubPage.tsx, ...)
├── features/       # One folder per feature, flat files inside, e.g.
│   └── events/
│       ├── EventCard.tsx   # UI used by this feature
│       ├── api.ts          # Backend calls (uses http() from @/lib/http)
│       └── types.ts        # Types for this feature
├── components/     # Shared UI used by several features (Button, Modal, ...)
└── lib/            # Helpers: http.ts (API client), env.ts (VITE_* config)
```

Rules of thumb:
- **Pages are thin:** they put features together; the real work lives in `features/`.
- **No `fetch` in components:** backend calls go in a feature's `api.ts`.
- **Start inside the feature;** move something to `components/` or `lib/` only once a second feature needs it.
- Add sub-folders (e.g. `features/events/components/`) only when a feature grows to many files.

## API errors
Every non-2xx response is an RFC 9457 Problem Details body (Spring `ProblemDetail`,
`Content-Type: application/problem+json`) with two extra members:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Please check the highlighted fields.",
  "instance": "/api/auth/register",
  "code": "VALIDATION_FAILED",
  "fieldErrors": { "password": "Password must be at least 8 characters with a letter and a number." }
}
```

- `detail`: text shown to the user. 500 responses have no `detail` (nothing internal leaks out).
- `code`: stable, machine-readable reason. The full list is `src/lib/errorCodes.ts`.
  The frontend decides what to do from `status` + `code`, **never from the `detail` text**.
- `fieldErrors`: only for validation errors, keyed by the request field name (`email`, `password`, ...),
  so each message appears under the matching form field.

`http()` turns this into an `HttpError` with `status`, `code`, `fieldErrors` and `message` (= `detail`).

## Build
```bash
npm run build      # type-checks, then writes static files to dist/
npm run preview    # serve dist/ locally to check the build
```
`dist/` contains only static files (`index.html` + hashed assets under `dist/assets/`).
On merge to `main`, `.github/workflows/deploy.yml` uploads `dist/` to S3 and unpacks it on the EC2
instance under `/var/www/campushub/` (served by nginx, which also proxies `/api` to the backend).
AWS setup: see `campushub-backend/deploy/README.md`.

In CI, prefer `npm ci` over `npm install` (requires the committed `package-lock.json`).

### Hosting notes
- Files under `assets/` have content hashes in their names and can be cached forever
  (`Cache-Control: public, max-age=31536000, immutable`); `index.html` should be `no-cache`.
- The app uses client-side routing (`/login`, `/events/12`, ...), so the server must answer unknown paths
  with `index.html`. The production nginx config already does this
  (`try_files $uri $uri/ /index.html;` in `campushub-backend/deploy/nginx-campushub.conf`);
  Vite's dev and preview servers do it too.

## Configuration
Build-time env vars (see `.env.example`):

| Variable            | Default | Purpose                                              |
|---------------------|---------|------------------------------------------------------|
| `VITE_API_BASE_URL` | `""`    | API origin; empty means same origin (`/api/...`).    |
