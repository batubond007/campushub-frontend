// Builds the React app into static files in dist/ (no framework, no dev server framework).
//
//   npm run build          -> dist/index.html, dist/assets/app.js, dist/assets/app.css
//   npm run dev            -> rebuilds on every change and serves dist/ on http://localhost:3000
//
// There is no backend: all data comes from the in-browser mock API in src/mock.
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const port = Number(process.env.PORT ?? 3000);

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });
cpSync('public', 'dist', { recursive: true });

const options = {
  entryPoints: { app: 'src/main.tsx' },
  outdir: 'dist/assets',
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  sourcemap: serve,
  minify: !serve,
  jsx: 'automatic',
  loader: { '.svg': 'file', '.png': 'file' },
  define: {
    'process.env.NODE_ENV': JSON.stringify(serve ? 'development' : 'production'),
  },
  logLevel: 'info',
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port: actualPort } = await ctx.serve({ servedir: 'dist', port });
  console.log(`\n  CampusHub is running at http://localhost:${actualPort}  (mock data)\n`);
} else {
  await esbuild.build(options);
  console.log(`\n  Static build ready in dist/  (mock data)\n`);
}
