import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

import { parseServerEnv } from "./src/modules/shared/lib/env/schema";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const env = parseServerEnv(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/modules/shared/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: env.DATABASE_URL },
  // Only manage our own schema; Supabase owns auth, storage, realtime, etc.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
