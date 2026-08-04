const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  // Babel transpile + CDN React load takes a while
  timeout: 60_000,
  expect: { timeout: 20_000 },
  webServer: {
    command: 'npx serve --no-clipboard -l 4321 .',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
