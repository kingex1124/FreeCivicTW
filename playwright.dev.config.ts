import { defineConfig } from '@playwright/test';
import { getDevelopmentOrigins } from './src/Config/DevelopmentConfig';

const localNetworkHost = getDevelopmentOrigins().find(
  (host) => host !== 'localhost' && host !== '127.0.0.1',
);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const baseURL =
  process.env.TEST_DEV_URL ?? `http://${localNetworkHost ?? 'localhost'}:3000${basePath}/`;

export default defineConfig({
  testDir: './tests/dev',
  fullyParallel: false,
  workers: 1,
  timeout: 35000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --hostname 0.0.0.0',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
