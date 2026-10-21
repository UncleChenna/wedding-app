import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "../env";
import * as schema from "./schema";

/**
 * Drizzle client for server code (Server Components, Server Actions, Route
 * Handlers). One connection pool per process; reused across hot reloads.
 */
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

// `prepare: false` keeps this compatible with Supabase's transaction pooler in production.
const pgClient =
  globalForDb.pgClient ?? postgres(serverEnv.DATABASE_URL, { max: 10, prepare: false });
if (serverEnv.NODE_ENV !== "production") globalForDb.pgClient = pgClient;

export const db = drizzle(pgClient, { schema });
export type Db = typeof db;
export { schema };
