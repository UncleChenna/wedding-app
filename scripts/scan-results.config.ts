import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "scan-results.spec.ts",
  outputDir: "../artifacts/TICKET-060/cached-browser",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "cached-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "cached-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
