import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5174/";
const webServer =
  process.env.PLAYWRIGHT_BASE_URL === undefined
    ? {
        command: "pnpm dev --host 127.0.0.1 --port 5174 --strictPort",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        url: baseURL,
      }
    : undefined;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  testDir: "tests/e2e",
  timeout: 180_000,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer,
});
