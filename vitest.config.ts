import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside React Server Components; tests import server code directly.
      "server-only": fileURLToPath(new URL("./vitest.server-only-stub.ts", import.meta.url)),
    },
  },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}", "scripts/**/__tests__/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "artifacts/coverage",
      reportOnFailure: true,
      include: [
        "src/modules/checkin/lib/**/*.ts",
        "src/modules/invitations/lib/token.ts",
        "src/modules/ordering/lib/order.ts",
        "src/modules/ordering/lib/order-limits.ts",
      ],
      reporter: ["text", "json", "json-summary"],
      thresholds: { perFile: true, lines: 95, branches: 95 },
    },
  },
});
