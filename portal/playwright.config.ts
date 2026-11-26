import { defineConfig } from '@playwright/test'

import { anvilUrl } from './e2e/anvil'
import { portalApiUrl } from './e2e/fixtures/wallet'

const port = 5174
const baseURL = `http://localhost:${port}`
const isCI = !!process.env.CI

export default defineConfig({
  expect: { timeout: 30_000 },
  forbidOnly: isCI,
  fullyParallel: false,
  globalSetup: './e2e/globalSetup.ts',
  reporter: isCI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  timeout: 120_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm exec vite --port ${port} --strictPort`,
    env: {
      VITE_CUSTOM_RPC_URL_HEMI_MAINNET: anvilUrl,
      VITE_PORTAL_API_URL: portalApiUrl,
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
  workers: 1,
})
