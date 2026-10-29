import { defineConfig } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '8099';
const BASE = `http://localhost:${PORT}`;

// Suite E2E automatizada que valida los 4 escenarios obligatorios del QA Checklist.
// Levanta el backend real en el puerto 8099 sobre PostgreSQL WASM (PGlite) sin necesitar
// Docker ni levantar navegadores pesados: usa el fixture HTTP `request` de Playwright
// para bombardear la API con concurrencia real y medir respuestas al milisegundo.
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    extraHTTPHeaders: { 'content-type': 'application/json' },
  },
  webServer: {
    command: 'node --import tsx src/server.ts',
    cwd: '../apps/backend',
    env: { PORT, LOG_LEVEL: 'warn' },
    url: `${BASE}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
