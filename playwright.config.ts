import { existsSync, readFileSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const worktree = existsSync(".harness/worktree.json")
  ? (JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { pwPort: number })
  : null;
const PORT = Number(process.env.PW_PORT ?? worktree?.pwPort ?? 3100);
const baseURL = `http://localhost:${PORT}`;
// `pnpm verify` runs against the production build; `pnpm screenshots` uses the dev server.
const useDevServer = process.env.PW_SERVER === "dev";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile",
      testIgnore: /visual\//,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop",
      testIgnore: /visual\//,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "visual",
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: useDevServer ? `pnpm dev --port ${PORT}` : `pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
