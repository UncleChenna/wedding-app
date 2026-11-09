import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "guest-snapshot-store.spec.ts",
  outputDir: "../artifacts/TICKET-065/store",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "snapshot-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "snapshot-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
