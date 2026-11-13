import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: [
    "offline-queue-store.spec.ts",
    "offline-queue-worker.spec.ts",
    "private-pass-lifecycle.spec.ts",
    "queue-upgrade.spec.ts",
  ],
  outputDir: "../artifacts/TICKET-066/store",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "queue-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "queue-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
