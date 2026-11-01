import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { environmentBoundary } from "./scripts/eslint/environment-boundary.mjs";

// Colours must come from theme tokens (CSS custom properties), never literals.
const COLOUR_LITERAL = "/(#[0-9a-fA-F]{3,8}\\b|\\b(rgba?|hsla?|oklch|oklab)\\()/";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { secrets: { rules: { "environment-boundary": environmentBoundary } } },
    ignores: ["src/**/__tests__/**"],
    rules: {
      "secrets/environment-boundary": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=${COLOUR_LITERAL}]`,
          message:
            "No hard-coded colours. Use a theme token class (e.g. bg-primary) or var(--t-color-*). See docs/theming.md.",
        },
        {
          selector: `TemplateElement[value.raw=${COLOUR_LITERAL}]`,
          message:
            "No hard-coded colours. Use a theme token class (e.g. bg-primary) or var(--t-color-*). See docs/theming.md.",
        },
      ],
    },
  },
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "**/app/*"],
              message:
                "Modules must not import from src/app. Routes call modules, not the reverse.",
            },
          ],
        },
      ],
    },
  },
  {
    // Scripts and the logger are allowed to write to stdout.
    files: ["scripts/**", "src/modules/shared/lib/logger.ts", "e2e/**"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".worktrees/**",
    ".harness/**",
    "tooling/plugin/dist/**",
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "artifacts/**",
    "drizzle/**",
    "next-env.d.ts",
  ]),
]);
