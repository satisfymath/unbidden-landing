import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  retries: 0,
  reporter: [['list']],
  outputDir: '../../test-results',
  use: { baseURL: process.env.QA_URL ?? 'http://localhost:4181/', trace: 'off' },
  webServer: process.env.QA_URL ? undefined : { command: 'npm run preview -- --port 4181 --strictPort', url: 'http://localhost:4181/', reuseExistingServer: true, cwd: '../..' },
  projects: [
    { name: 'desktop-chrome', use: { channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    { name: 'reduced-motion', use: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } },
  ],
})
