import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/electron',
  timeout: 120000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    viewport: { width: 1400, height: 900 },
    trace: 'retain-on-failure'
  }
});
