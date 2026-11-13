import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "private-pass-lifecycle.spec.ts",
  outputDir: "../artifacts/TICKET-184/browser",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "privacy-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "privacy-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
