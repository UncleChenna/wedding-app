import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../src/modules/shared/server/db/schema";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: Sql;
const rollback = new Error("rollback fixtures");
async function exercise(run: (tx: TransactionSql) => Promise<void>) {
  try {
    await db.begin(async (tx) => {
      await run(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

describe.runIf(process.env.RUN_SETTINGS_DB_TESTS === "1")(
  "event settings and audit constraints",
  () => {
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      const config = readFileSync(".harness/supabase-project/supabase/config.toml", "utf8");
      const port = config
        .split("[db]\n")[1]
        ?.split("\n[")[0]
        ?.match(/^port\s*=\s*(\d+)$/m)?.[1];
      const url = new URL(process.env.DATABASE_URL ?? "");
      if (!["localhost", "127.0.0.1"].includes(url.hostname) || !port || url.port !== port)
        throw new Error("Use this worktree's isolated database only");
      db = postgres(url.toString(), { max: 1, connect_timeout: 10 });
      await db`select 1`;
    });
    afterAll(async () => {
      if (db) await db.end();
    });

    it("allows only one settings row, with draft-safe defaults", async () => {
      await exercise(async (tx) => {
        const [row] = await tx`insert into event_settings default values returning *`;
        expect(row).toMatchObject({
          id: 1,
          couple_names: ["Uchenna", "Adaora"],
          event_date: new Date("2026-12-19T00:00:00.000Z"),
          time_zone: null,
          rsvp_lock_at: null,
          ordering_open: false,
          default_max_tag_alongs: 1,
          retention_days: 90,
        });
        await expect(
          tx.savepoint((sp) => sp`insert into event_settings default values`),
        ).rejects.toMatchObject({ code: "23505" });
        await expect(
          tx.savepoint((sp) => sp`insert into event_settings (id) values (2)`),
        ).rejects.toMatchObject({ code: "23514" });
      });
    });

    it("maps real stored settings through the public typed accessor", async () => {
      const { getEventSettings } = await import("../../src/modules/shared/server/settings");
      const database = drizzle(db, { schema });
      expect(await getEventSettings(database)).toMatchObject({
        eventDate: "2026-12-19",
        venue: null,
        rsvpLockAt: null,
      });
      const cutoff = new Date("2026-12-18T23:00:00.000Z");
      try {
        await database.transaction(async (tx) => {
          await tx.insert(schema.eventSettings).values({
            id: 1,
            venue: "Integration fixture",
            ceremonyTime: "14:30:00",
            timeZone: "Africa/Lagos",
            rsvpLockAt: cutoff,
          });
          expect(await getEventSettings(tx)).toMatchObject({
            coupleNames: ["Uchenna", "Adaora"],
            eventDate: "2026-12-19",
            venue: "Integration fixture",
            ceremonyTime: "14:30:00",
            timeZone: "Africa/Lagos",
            rsvpLockAt: cutoff,
            orderingOpen: false,
          });
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;
      }
    });

    it("rejects unsafe settings and a cutoff with no event time zone", async () => {
      await exercise(async (tx) => {
        for (const query of [
          "insert into event_settings (default_max_tag_alongs) values (11)",
          "insert into event_settings (retention_days) values (0)",
          "insert into event_settings (max_item_quantity) values (0)",
          "insert into event_settings (rsvp_lock_at) values (now())",
          "insert into event_settings (couple_names) values (ARRAY['Only one'])",
        ])
          await expect(tx.savepoint((sp) => sp.unsafe(query))).rejects.toMatchObject({
            code: "23514",
          });
      });
    });

    it("allows audit inserts but rejects update, delete and truncate, even as table owner", async () => {
      await exercise(async (tx) => {
        const [invitation] = await tx<
          { id: string }[]
        >`insert into invitations (token) values (${randomBytes(32).toString("base64url")}) returning id`;
        if (!invitation) throw new Error("Fixture missing");
        const [change] = await tx<
          { id: string }[]
        >`insert into rsvp_changes (invitation_id, after, actor) values (${invitation.id}, '{"attending":true}', 'guest') returning id`;
        if (!change) throw new Error("Audit fixture missing");
        await expect(
          tx.savepoint(
            (sp) => sp`update rsvp_changes set actor = 'changed' where id = ${change.id}`,
          ),
        ).rejects.toMatchObject({ code: "42501" });
        await expect(
          tx.savepoint((sp) => sp`delete from rsvp_changes where id = ${change.id}`),
        ).rejects.toMatchObject({ code: "42501" });
        await expect(tx.savepoint((sp) => sp`truncate rsvp_changes`)).rejects.toMatchObject({
          code: "42501",
        });
        await expect(
          tx.savepoint((sp) => sp`delete from invitations where id = ${invitation.id}`),
        ).rejects.toMatchObject({ code: "23503" });
        const [count] =
          await tx`select count(*)::int as n from rsvp_changes where id = ${change.id}`;
        expect(count?.n).toBe(1);
      });
    });

    it("rejects malformed audit snapshots and blank actors", async () => {
      await exercise(async (tx) => {
        const [invitation] = await tx<
          { id: string }[]
        >`insert into invitations (token) values (${randomBytes(32).toString("base64url")}) returning id`;
        if (!invitation) throw new Error("Fixture missing");
        await expect(
          tx.savepoint(
            (sp) =>
              sp`insert into rsvp_changes (invitation_id, after, actor) values (${invitation.id}, '[]', 'guest')`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
        await expect(
          tx.savepoint(
            (sp) =>
              sp`insert into rsvp_changes (invitation_id, after, actor) values (${invitation.id}, '{}', ' ')`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
      });
    });

    it("keeps RLS enabled and removes mutation grants from runtime roles", async () => {
      const tables =
        await db`select relrowsecurity from pg_class where oid in ('public.event_settings'::regclass, 'public.rsvp_changes'::regclass)`;
      expect(tables).toHaveLength(2);
      expect(tables.every((row) => row.relrowsecurity)).toBe(true);
      const roles =
        await db`select rolname, has_table_privilege(oid, 'public.rsvp_changes', 'UPDATE,DELETE,TRUNCATE') as can_mutate from pg_roles where rolname in ('anon','authenticated','service_role')`;
      expect(roles).toHaveLength(3);
      expect(roles.every((row) => !row.can_mutate)).toBe(true);
    });
  },
);
