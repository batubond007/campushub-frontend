// Base URL for backend calls. Empty by default, so requests go to the same origin
// (`/api/...`): the Vite dev proxy in dev, and the reverse proxy in production.
// Override at build time with VITE_API_BASE_URL if the API lives on another host.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
