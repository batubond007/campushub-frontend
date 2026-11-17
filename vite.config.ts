import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { authMock } from './mock/authMock'

// Static SPA build: `npm run build` emits plain HTML/JS/CSS into dist/,
// which the CI pipeline copies to the web server / bucket as-is.
export default defineConfig(({ mode }) => ({
  // `npm run dev:mock` (mode "mock") answers /api/auth/* with a fake backend; see mock/authMock.ts.
  plugins: [react(), ...(mode === 'mock' ? [authMock()] : [])],
  resolve: {
    // `@/` points at src/, so imports look like `@/lib/http` instead of `../../lib/http`.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    // In dev, forward API calls to the Spring Boot backend so no CORS setup is needed.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}))
