import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "queue-upgrade.spec.ts",
  outputDir: "../artifacts/TICKET-180/browser",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "upgrade-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "upgrade-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
