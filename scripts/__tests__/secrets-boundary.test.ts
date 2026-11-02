import { ESLint } from "eslint";
import { expect, it } from "vitest";
import config from "../../eslint.config.mjs";
// Import the actual project config during module loading, like ESLint CLI startup.
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
async function violations(
  source: string,
  filePath = "src/modules/shared/components/secret-fixture.tsx",
) {
  const [result] = await eslint.lintText(source, { filePath });
  return result?.messages.filter((m) => m.ruleId === "secrets/environment-boundary") ?? [];
}
it.each([
  "const p = globalThis.process; export const value = p.env.DATABASE_URL;",
  'import type {} from "server-only"; export const value = process.env.DATABASE_URL;',
  'const p = await import("node:process"); export const value = p.env.DATABASE_URL;',
  "const root = globalThis; export const value = root.process.env.DATABASE_URL;",
  'const p = require("node:process"); export const value = p.env.DATABASE_URL;',
  "export const value = process.env.DATABASE_URL;",
  'export const value = process["env"]["GATE_SIGNING_PRIVATE_KEY"];',
  "const env = process.env; export const value = env.DATABASE_URL;",
  "const {env} = process; export const value = env.DATABASE_URL;",
  "const p = process; export const value = p.env.DATABASE_URL;",
  "export const value = globalThis.process.env.DATABASE_URL;",
  "export const value = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;",
  "export const value = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN;",
  'const key = "DATABASE_URL"; export const value = process.env[key];',
  'import process from "node:process"; export const value = process.env.DATABASE_URL;',
  'import {env} from "node:process"; export const value = env.DATABASE_URL;',
])("rejects unsafe access: %s", async (source) => {
  expect(await violations(source)).not.toEqual([]);
});
it.each([
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NODE_ENV",
])("allows %s", async (name) => {
  expect(await violations("export const value = process.env." + name + ";")).toEqual([]);
});
it("requires server-only even in a server directory", async () => {
  const path = "src/modules/shared/server/secret-fixture.ts";
  expect(await violations("export const value = process.env.DATABASE_URL;", path)).not.toEqual([]);
  expect(
    await violations('import "server-only"; export const value = process.env.DATABASE_URL;', path),
  ).toEqual([]);
});
it("rejects client directives borrowing a server exemption", async () => {
  expect(
    await violations(
      '"use client"; import "server-only"; export const value = process.env.DATABASE_URL;',
      "src/modules/shared/server/secret-fixture.ts",
    ),
  ).not.toEqual([]);
});
it("rejects secret public names even on the server", async () => {
  expect(
    await violations(
      'import "server-only"; export const value = process.env.NEXT_PUBLIC_DATABASE_URL;',
      "src/modules/shared/server/secret-fixture.ts",
    ),
  ).not.toEqual([]);
});
