// Automatic tests for the website: behaviour, accessibility and layout.
// Run with `npm test`. The tests build the site first, then serve _site/.
import { defineConfig } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx @11ty/eleventy --quiet && node scripts/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  // The same three screen sizes as `npm run shots`.
  projects: [
    {
      name: "phone",
      use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
    { name: "laptop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "desktop", use: { viewport: { width: 2560, height: 1440 } } },
  ],
});
