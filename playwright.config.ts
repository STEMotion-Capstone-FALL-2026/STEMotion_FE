import { defineConfig, devices } from '@playwright/test';

/**
 * Browser end-to-end tests of the main workflows (Design Brief A1, WF-01..WF-04).
 *
 * They run against a throwaway back end: STEMotion_BE's test-scope E2eServer starts the real
 * API on an embedded PostgreSQL, with every paid AI/TTS/render call switched off. Never point
 * E2E_API_URL at the shared or production database: the tests create users and workspaces.
 */
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5174);
const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:18080/api/v1';
const BE_DIR = process.env.E2E_BE_DIR ?? '../STEMotion_BE';

export default defineConfig({
  testDir: './e2e',
  // Each spec walks one workflow in order; steps share the accounts they create.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', title: 'STEMotion E2E – Review 2' }]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    launchOptions: process.env.E2E_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.E2E_CHROMIUM_EXECUTABLE }
      : undefined,
    // In CI the report is published as evidence (BM04), so it keeps every run, passed or not.
    trace: process.env.CI ? 'on' : 'retain-on-failure',
    screenshot: process.env.CI ? 'on' : 'only-on-failure',
    video: process.env.CI ? 'on' : 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Set E2E_API_URL to a running throwaway back end to skip starting this one.
      command: `mvn -q -f ${BE_DIR}/pom.xml test-compile spring-boot:test-run -Dspring-boot.run.main-class=com.stemotion.e2e.E2eServer`,
      url: API_URL.replace(/\/api\/v1$/, '/v3/api-docs'),
      reuseExistingServer: true,
      timeout: 240_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { VITE_API_BASE_URL: API_URL, VITE_GOOGLE_CLIENT_ID: 'e2e-fixture.apps.googleusercontent.com' },
    },
  ],
});
