import { defineConfig } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '8099';
const BASE = `http://localhost:${PORT}`;

/**
 * Suite E2E (Rol 3, Sprint 9). Levanta el Backend Core real (PGlite embebido) y
 * valida por HTTP los 4 criterios obligatorios del QA Checklist.xlsx.
 * No requiere navegador ni Docker: usa el `request` fixture de Playwright.
 */
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
