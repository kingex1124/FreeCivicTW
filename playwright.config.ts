import { defineConfig } from '@playwright/test';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const origin = `http://localhost:${process.env.PORT ?? 4173}`;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 35000,
  expect: { timeout: 7000 },
  reporter: 'list',
  use: {
    baseURL: origin + base + '/',
    browserName: 'chromium',
    ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    url: origin + base + '/',
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
  },
});
