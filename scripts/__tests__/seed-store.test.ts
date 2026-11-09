import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../../src/modules/shared/server/db/schema";
import { assertDatabaseTarget } from "../database-target";
import { buildSeedData } from "../seed-data";
import { writeSeedData } from "../seed-store";

let client: Sql;
// Explicit opt-in: this suite replaces only the caller's disposable local fixtures.
describe.runIf(process.env.RUN_SEED_DB_TESTS === "1")("persisted seed repeatability", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
  });
  afterAll(async () => {
    if (client) await client.end({ timeout: 1 });
  });

  it.each(["default", "load"] as const)("repeats every persisted row for %s", async (profile) => {
    const db = drizzle(client, { schema });
    const data = buildSeedData(20261021, profile);
    async function snapshot() {
      const tables = await client<{ tablename: string }[]>`
        select tablename from pg_tables where schemaname = 'public' order by tablename`;
      const hashes: Record<string, string> = {};
      for (const { tablename } of tables) {
        const rows =
          await client`select to_jsonb(t) as row from ${client(tablename)} t order by to_jsonb(t)::text`;
        hashes[tablename] = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
      }
      return hashes;
    }
    await db.transaction((tx) => writeSeedData(tx, data));
    const first = await snapshot();
    await db.transaction((tx) => writeSeedData(tx, data));
    expect(await snapshot()).toEqual(first);
    const counts = await client<{ count: number }[]>`select count(*)::int as count from guests`;
    expect(counts[0]?.count).toBe(profile === "load" ? 350 : data.guests.length);
    const counters = await db.select().from(schema.admissionCounters);
    expect(
      counters.some(
        (counter) => counter.admittedPeople > 0 && counter.admittedPeople < counter.allowance,
      ),
    ).toBe(true);
    expect(counters.every((counter) => counter.admittedPeople <= counter.allowance)).toBe(true);
    const disabled =
      await client`select tgname from pg_trigger where not tgisinternal and tgenabled <> 'O'`;
    expect(disabled).toEqual([]);
  });
});
