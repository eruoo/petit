import { defineConfig, devices } from "@playwright/test";

const previewPort = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
if (!Number.isInteger(previewPort) || previewPort < 1 || previewPort > 65535) {
  throw new Error("PLAYWRIGHT_PORT must be an integer between 1 and 65535");
}
const previewUrl = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: previewUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm preview --port ${previewPort}`,
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
