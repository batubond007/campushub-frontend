# CampusHub Frontend

Static React (Vite + TypeScript) single-page app.

## Visuals
<img width="1339" height="943" alt="image" src="https://github.com/user-attachments/assets/c0a5da53-632b-4f06-a7e0-fb4a262128fe" />
<img width="1339" height="847" alt="image" src="https://github.com/user-attachments/assets/78733153-b7be-48ea-9354-2c9806539c46" />
<img width="1334" height="370" alt="image" src="https://github.com/user-attachments/assets/097223fa-68e3-4c01-8dc8-8842b1e40353" />


## Requirements
- Node.js 22 (see `.nvmrc`; minimum 20.19)

## Development
```bash
npm install
npm run dev        # http://localhost:5173
```
Requests to `/api/*` are proxied to the backend at `http://localhost:8080` (see `vite.config.ts`).

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
On merge to `main`, `.github/workflows/deploy.yml` uploads `dist/` to S3 and unpacks it on the EC2
instance under `/var/www/campushub/` (served by nginx, which also proxies `/api` to the backend).
AWS setup: see `campushub-backend/deploy/README.md`.

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
