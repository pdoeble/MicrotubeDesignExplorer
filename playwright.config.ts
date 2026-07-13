import { defineConfig, devices } from "@playwright/test";
import { normalizeViteBasePath } from "./src/config/viteBase";

const managedPreviewPath = process.env.PLAYWRIGHT_MANAGED_PREVIEW_PATH
  ? normalizeViteBasePath(process.env.PLAYWRIGHT_MANAGED_PREVIEW_PATH)
  : undefined;
const managedPreviewPort = process.env.PLAYWRIGHT_MANAGED_PREVIEW_PORT ?? "4175";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (managedPreviewPath
    ? `http://127.0.0.1:${managedPreviewPort}${managedPreviewPath}`
    : "http://127.0.0.1:5174/");
const webServer =
  process.env.PLAYWRIGHT_BASE_URL === undefined
    ? {
        command: managedPreviewPath
          ? `pnpm preview --host 127.0.0.1 --port ${managedPreviewPort} --strictPort`
          : "pnpm dev --host 127.0.0.1 --port 5174 --strictPort",
        reuseExistingServer: managedPreviewPath ? false : !process.env.CI,
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
