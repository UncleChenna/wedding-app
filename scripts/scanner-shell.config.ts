import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "scanner-shell-store.spec.ts",
  outputDir: "../artifacts/TICKET-108/store",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "scanner-store-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "scanner-store-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
