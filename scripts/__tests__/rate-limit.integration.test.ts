import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";

let first: Sql;
let second: Sql;
const identities: string[] = [];
function identity() {
  const value = randomBytes(32).toString("hex");
  identities.push(value);
  return value;
}

describe.runIf(process.env.RUN_RATE_LIMIT_DB_TESTS === "1")("shared atomic request budgets", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    first = postgres(url, { max: 4, prepare: false });
    second = postgres(url, { max: 4, prepare: false });
  });
  afterAll(async () => {
    if (first) {
      for (const value of identities) {
        await first`delete from request_budgets where identity = ${value}`;
      }
      await first.end();
    }
    if (second) await second.end();
  });

  it("never overshoots a budget shared by independent connection pools", async () => {
    const { consumeRequestBudget } = await import("../../src/modules/shared/server/request-budget");
    const clients = [drizzle(first, { schema }), drizzle(second, { schema })] as const;
    const key = identity();
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, index) =>
        consumeRequestBudget(clients[index % 2] ?? clients[0], {
          identity: key,
          scope: "pin",
          limit: 5,
          windowSeconds: 600,
        }),
      ),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
    expect(results.filter((result) => !result.allowed)).toHaveLength(25);
    const [row] = await first`select used from request_budgets where identity = ${key}`;
    expect(row?.used).toBe(5);
    for (const result of results.filter((value) => !value.allowed)) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(600);
    }
  });

  it("does not extend a denial window and resets after expiry using database time", async () => {
    const { consumeRequestBudget } = await import("../../src/modules/shared/server/request-budget");
    const budget = { identity: identity(), scope: "pin" as const, limit: 1, windowSeconds: 600 };
    expect((await consumeRequestBudget(drizzle(first, { schema }), budget)).allowed).toBe(true);
    const [before] =
      await first`select expires_at from request_budgets where identity = ${budget.identity}`;
    expect((await consumeRequestBudget(drizzle(second, { schema }), budget)).allowed).toBe(false);
    const [after] =
      await first`select expires_at from request_budgets where identity = ${budget.identity}`;
    expect(after?.expires_at).toEqual(before?.expires_at);
    await first`update request_budgets set expires_at = now() - interval '1 second' where identity = ${budget.identity}`;
    expect((await consumeRequestBudget(drizzle(second, { schema }), budget)).allowed).toBe(true);
  });

  it("keeps lookup traffic separate from PIN attempts and other networks", async () => {
    const { consumeRequestBudget } = await import("../../src/modules/shared/server/request-budget");
    const db = drizzle(first, { schema });
    const budget = { identity: identity(), scope: "pin" as const, limit: 1, windowSeconds: 600 };
    await consumeRequestBudget(db, budget);
    expect((await consumeRequestBudget(db, budget)).allowed).toBe(false);
    expect((await consumeRequestBudget(db, { ...budget, scope: "lookup" })).allowed).toBe(true);
    expect((await consumeRequestBudget(db, { ...budget, identity: identity() })).allowed).toBe(
      true,
    );
  });

  it("enables RLS without granting browser access", async () => {
    const [row] =
      await first`select relrowsecurity from pg_class where oid = 'public.request_budgets'::regclass`;
    expect(row?.relrowsecurity).toBe(true);
    const policies =
      await first`select policyname from pg_policies where schemaname = 'public' and tablename = 'request_budgets'`;
    expect(policies).toHaveLength(0);
  });
});
