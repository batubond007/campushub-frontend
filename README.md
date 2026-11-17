# CampusHub Frontend

Static React (Vite + TypeScript) single-page app.

## Mock Accounts:
Mock Accounts (password: Demo1234): ayse.yilmaz@metu.edu.tr verified, burak.celik@metu.edu.tr not verified, zeynep.demir@metu.edu.tr University Admin (can create events). Verification code: 123456 Do not copy-paste!

## Visuals
<img width="1510" height="1074" alt="image" src="https://github.com/user-attachments/assets/c6acfe8a-4822-4b30-9d77-b8101b81e34d" />
<img width="1510" height="1074" alt="image" src="https://github.com/user-attachments/assets/ec0170e1-65b4-4005-a3be-2035e246db1d" />


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
listing events and creating events (University Admin only), with the same rules
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

## Build
```bash
npm run build      # type-checks, then writes static files to dist/
npm run preview    # serve dist/ locally to check the build
```
`dist/` contains only static files (`index.html` + hashed assets under `dist/assets/`).
CI copies the contents of `dist/` to the hosting target.

In CI, prefer `npm ci` over `npm install` (requires the committed `package-lock.json`).

### Hosting notes
- Files under `assets/` have content hashes in their names and can be cached forever
  (`Cache-Control: public, max-age=31536000, immutable`); `index.html` should be `no-cache`.
- If client-side routing is added later, the server must fall back to `index.html` for unknown paths.

## Configuration
Build-time env vars (see `.env.example`):

| Variable            | Default | Purpose                                              |
|---------------------|---------|------------------------------------------------------|
| `VITE_API_BASE_URL` | `""`    | API origin; empty means same origin (`/api/...`).    |
