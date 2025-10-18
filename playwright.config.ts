import type { PlaywrightTestConfig } from '@playwright/test'

process.env.PLAYWRIGHT_TEST = process.env.PLAYWRIGHT_TEST ?? '1'

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: {},
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream'],
    },
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PLAYWRIGHT_TEST: '1',
    },
  },
}

export default config
