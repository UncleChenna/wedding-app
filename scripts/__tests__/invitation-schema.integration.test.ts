import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Explicit integration opt-in: normal unit runs do not imply database verification.
const enabled = process.env.RUN_INVITATION_DB_TESTS === "1";
const rollback = new Error("rollback test fixtures");
let db: Sql;

async function exercise(run: (tx: TransactionSql) => Promise<void>): Promise<void> {
  try {
    await db.begin(async (tx) => {
      await run(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

async function invitation(tx: TransactionSql): Promise<string> {
  const [row] = await tx<{ id: string }[]>`
    insert into invitations (token) values (${randomBytes(32).toString("base64url")}) returning id`;
  if (!row) throw new Error("Invitation was not inserted");
  return row.id;
}

describe.runIf(enabled)("invitation schema on isolated Postgres", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const config = readFileSync(".harness/supabase-project/supabase/config.toml", "utf8");
    const dbSection = config.split("[db]\n")[1]?.split("\n[")[0];
    const expectedPort = dbSection?.match(/^port\s*=\s*(\d+)$/m)?.[1];
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      !expectedPort ||
      url.port !== expectedPort
    ) {
      throw new Error("Constraint tests require this worktree's isolated local database");
    }
    db = postgres(url.toString(), { max: 1, connect_timeout: 10 });
    await db`select 1`;
  });
  afterAll(async () => {
    if (db) await db.end();
  });

  it("defaults to one tag-along and a draft invitation", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      const [row] =
        await tx`select max_tag_alongs, status, token_version from invitations where id = ${id}`;
      expect(row).toMatchObject({ max_tag_alongs: 1, status: "draft", token_version: 1 });
    });
  });

  it("requires a unique, non-null token of sufficient length", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into invitations (token) select token from invitations where id = ${id}`,
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        tx.savepoint((sp) => sp`insert into invitations (token) values (null)`),
      ).rejects.toMatchObject({ code: "23502" });
      await expect(
        tx.savepoint((sp) => sp`insert into invitations (token) values ('guessable')`),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("accepts capacity boundaries and rejects negative or excessive tag-alongs", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      for (const capacity of [0, 10])
        await tx`update invitations set max_tag_alongs = ${capacity} where id = ${id}`;
      for (const capacity of [-1, 11])
        await expect(
          tx.savepoint(
            (sp) => sp`update invitations set max_tag_alongs = ${capacity} where id = ${id}`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("allows only one RSVP and consistent attendance counts", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      await tx`insert into rsvps (invitation_id, attending, count_attending) values (${id}, true, 2)`;
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into rsvps (invitation_id, attending, count_attending) values (${id}, false, 0)`,
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        tx.savepoint((sp) => sp`update rsvps set count_attending = 0 where invitation_id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint((sp) => sp`update rsvps set attending = false where invitation_id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
      await tx`update rsvps set attending = false, count_attending = 0 where invitation_id = ${id}`;
    });
  });

  it("stores a named guest with optional E.164 phone and meal details", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      await tx`insert into guests (invitation_id, name, phone, meal_choice, dietary_notes, is_primary)
        values (${id}, 'Example Guest', '+447700900123', 'Vegetarian', 'No nuts', true)`;
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into guests (invitation_id, name, phone) values (${id}, 'Guest', '07700900123')`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await tx`insert into guests (invitation_id, name) values (${id}, 'Companion')`;
    });
  });

  it("rejects invalid versions, statuses and missing table references", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      await expect(
        tx.savepoint((sp) => sp`update invitations set token_version = 0 where id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint((sp) => sp`update invitations set status = 'unknown' where id = ${id}`),
      ).rejects.toMatchObject({ code: "22P02" });
      await expect(
        tx.savepoint(
          (sp) =>
            sp`update invitations set table_id = '11111111-1111-4111-8111-111111111111' where id = ${id}`,
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects blank names, negative counts and missing response times", async () => {
    await exercise(async (tx) => {
      const id = await invitation(tx);
      await expect(
        tx.savepoint((sp) => sp`insert into guests (invitation_id, name) values (${id}, '  ')`),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint((sp) => sp`insert into guests (invitation_id, name) values (${id}, null)`),
      ).rejects.toMatchObject({ code: "23502" });
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into rsvps (invitation_id, attending, count_attending) values (${id}, false, -1)`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into rsvps (invitation_id, attending, count_attending, responded_at) values (${id}, false, 0, null)`,
        ),
      ).rejects.toMatchObject({ code: "23502" });
    });
  });

  it("removes the per-guest QR token and preserves RLS", async () => {
    const columns =
      await db`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'guests'`;
    expect(columns.map((row) => row.column_name)).not.toContain("qr_token");
    const tables =
      await db`select relrowsecurity from pg_class where oid in ('public.invitations'::regclass, 'public.guests'::regclass, 'public.rsvps'::regclass)`;
    expect(tables).toHaveLength(3);
    expect(tables.every((row) => row.relrowsecurity)).toBe(true);
  });
});
