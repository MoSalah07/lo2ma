import { defineConfig, devices } from '@playwright/test';
import type { AppOptions } from './e2e/fixtures';

const PORT = 3100;

/**
 * End-to-end tests run against the demo build (`npm run build:demo` first) in the Chrome that is already
 * installed, so nothing is downloaded. Every test runs in Arabic and English, light and dark.
 */
export default defineConfig<AppOptions>({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    channel: 'chrome',
    // Chrome's own fake microphone (a steady tone), allowed up front, so voice can be tested headless.
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
    permissions: ['microphone'],
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'ar-light', use: { appLocale: 'ar', colorScheme: 'light' } },
    { name: 'ar-dark', use: { appLocale: 'ar', colorScheme: 'dark' } },
    { name: 'en-light', use: { appLocale: 'en', colorScheme: 'light' } },
    { name: 'en-dark', use: { appLocale: 'en', colorScheme: 'dark' } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/ar`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
