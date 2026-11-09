import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "gate-verification.spec.ts",
  outputDir: "../artifacts/TICKET-057/browser",
  reporter: [
    ["list"],
    ["json", { outputFile: resolve("artifacts/TICKET-057/browser-results.json") }],
  ],
  projects: [
    { name: "gate-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "gate-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
