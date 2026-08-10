import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";
const externalBase = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());

/**
 * Two suites:
 * - `ci` — deterministic guards + landing/auth UI (safe for CI)
 * - `smoke` — full merchant journey (needs live credentials + crawl/AI)
 *
 * Default `npm run test:e2e` runs `ci` only.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: externalBase
    ? undefined
    : {
        // Project uses `output: "standalone"` — `next start` is unsupported.
        command: "node .next/standalone/server.js",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          PORT: "3000",
          HOSTNAME: "127.0.0.1",
        },
      },
  projects: [
    {
      name: "ci",
      testMatch: /ci\/.*\.spec\.ts/,
    },
    {
      name: "smoke",
      testMatch: /smoke\/.*\.spec\.ts/,
      timeout: 10 * 60_000,
    },
  ],
});
