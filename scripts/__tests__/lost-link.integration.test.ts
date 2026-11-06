import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import { submitLostLinkRequest } from "../../src/modules/invitations/server/lost-link-submission";

let db: Sql;
const rollback = new Error("rollback synthetic lost-link fixture");
async function isolated(test: (tx: TransactionSql) => Promise<void>) {
  try {
    await db.begin(async (tx) => {
      await test(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe.runIf(process.env.RUN_LOST_LINK_DB_TESTS === "1")("lost-link request storage", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    db = postgres(url, { max: 1, prepare: false });
  });
  afterAll(async () => {
    if (db) await db.end();
  });

  it("persists normalized requests with a neutral receipt and database-generated identity", () =>
    isolated(async (tx) => {
      const ids: string[] = [];
      const save = async (request: { name: string; contact: string; contactKind: string }) => {
        const [row] = await tx<{ id: string }[]>`
          insert into invitation_link_requests(name, contact, contact_kind)
          values (${request.name}, ${request.contact}, ${request.contactKind}) returning id`;
        if (!row) throw new Error("Missing synthetic request");
        ids.push(row.id);
      };
      const dependencies = { budget: async () => ({ status: "allowed" as const }), save };
      const first = await submitLostLinkRequest(
        { name: "  Sample   Guest ", contact: " SAMPLE@example.test " },
        dependencies,
      );
      const second = await submitLostLinkRequest(
        { name: "Another Guest", contact: "another@example.test" },
        dependencies,
      );
      expect(first.status).toBe("received");
      expect(second).toEqual(first);
      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toBe(ids[1]);
      const [stored] = await tx`
        select name, contact, contact_kind, created_at from invitation_link_requests
        where id = ${ids[0] ?? ""}`;
      expect(stored).toMatchObject({
        name: "Sample Guest",
        contact: "sample@example.test",
        contact_kind: "email",
      });
      expect(stored?.created_at).toBeInstanceOf(Date);
    }));

  it("rejects malformed direct writes without discarding valid requests", () =>
    isolated(async (tx) => {
      for (const [name, contact, kind] of [
        [" ", "sample@example.test", "email"],
        ["x".repeat(201), "sample@example.test", "email"],
        ["Sample", " ", "email"],
        ["Sample", "x".repeat(255), "email"],
        ["Sample", "sample@example.test", "unknown"],
      ]) {
        await expect(
          tx.savepoint(
            (sp) => sp`
          insert into invitation_link_requests(name, contact, contact_kind)
          values (${name ?? ""}, ${contact ?? ""}, ${kind ?? ""})`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
      }
      const rows = await tx`insert into invitation_link_requests(name, contact, contact_kind)
        values ('Sample', '+2348012345678', 'phone') returning id`;
      expect(rows).toHaveLength(1);
    }));

  it("enables RLS with no browser policies", async () => {
    const [table] = await db`select relrowsecurity from pg_class
      where oid = 'public.invitation_link_requests'::regclass`;
    expect(table?.relrowsecurity).toBe(true);
    const policies = await db`select policyname from pg_policies
      where schemaname = 'public' and tablename = 'invitation_link_requests'`;
    expect(policies).toHaveLength(0);
  });

  it("enforces ten requests, separates lookup and PIN budgets, and permits the next window", async () => {
    const { consumeRequestBudget } = await import("../../src/modules/shared/server/request-budget");
    const { requestBudgetPolicies } =
      await import("../../src/modules/shared/server/request-budget-gate");
    const identity = randomBytes(32).toString("hex");
    try {
      await drizzle(db, { schema }).transaction(async (tx) => {
        const consume = (scope: "lost_link" | "lookup" | "pin") =>
          consumeRequestBudget(tx, { identity, scope, ...requestBudgetPolicies[scope] });
        for (let index = 0; index < 10; index++) {
          expect((await consume("lost_link")).allowed).toBe(true);
        }
        const refused = await consume("lost_link");
        expect(refused.allowed).toBe(false);
        expect(refused.retryAfterSeconds).toBeGreaterThan(0);
        expect(refused.retryAfterSeconds).toBeLessThanOrEqual(60);
        expect((await consume("lookup")).allowed).toBe(true);
        expect((await consume("pin")).allowed).toBe(true);
        await tx.execute(sql`update request_budgets
          set expires_at = clock_timestamp() - interval '1 second'
          where scope = 'lost_link' and identity = ${identity}`);
        expect((await consume("lost_link")).allowed).toBe(true);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
