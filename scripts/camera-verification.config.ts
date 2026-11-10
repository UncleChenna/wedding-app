import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "camera-verification.spec.ts",
  outputDir: "../artifacts/TICKET-059/camera",
  reporter: "list",
  workers: 1,
  projects: [
    { name: "camera-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "camera-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
