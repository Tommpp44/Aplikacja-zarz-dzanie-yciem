import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`
const bundledChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

/**
 * E2E tests run against a *local* Supabase stack (`npm run db:start`) and a
 * production build of the app. Every run signs up a brand-new user, so tests
 * never touch real or shared data.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: fs.existsSync(bundledChromium) ? { executablePath: bundledChromium } : {},
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: `${baseURL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { NEXT_PUBLIC_SITE_URL: baseURL },
      },
})
