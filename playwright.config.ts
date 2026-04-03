import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load test credentials from .env.test (gitignored, not committed)
const envTestPath = path.resolve(__dirname, '.env.test');
if (fs.existsSync(envTestPath)) {
  for (const line of fs.readFileSync(envTestPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const defaultOrgSlug = process.env.E2E_ORG_SLUG || 'urban-loft';

/**
 * Playwright E2E config for ordering-frontend (ordersapp.codevertexitsolutions.com).
 * Tests run against the production base URL by default; set BASE_URL to override.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE_URL
      ? `${process.env.BASE_URL}/${defaultOrgSlug}`
      : `https://ordersapp.codevertexitsolutions.com/${defaultOrgSlug}`,
    headless: process.env.CI === 'true',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  timeout: 60_000,
});
