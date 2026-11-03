import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const enabled = process.env.RUN_STAFF_DB_TESTS === "1";
const rollback = new Error("rollback staff fixtures");
let db: Sql;
// Format-only fixture, not a credential for any known PIN.
const hash = "scrypt$16384$8$1$" + "ab".repeat(16) + "$" + "cd".repeat(64);

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

describe.runIf(enabled)("staff/device constraints on isolated Postgres", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const config = readFileSync(".harness/supabase-project/supabase/config.toml", "utf8");
    const port = config
      .split("[db]\n")[1]
      ?.split("\n[")[0]
      ?.match(/^port\s*=\s*(\d+)$/m)?.[1];
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (!["127.0.0.1", "localhost"].includes(url.hostname) || !port || url.port !== port)
      throw new Error("Staff tests require this worktree's isolated database");
    db = postgres(url.toString(), { max: 1, connect_timeout: 10 });
    await db`select 1`;
  });
  afterAll(async () => {
    if (db) await db.end();
  });

  it("preserves unprovisioned staff and supports PIN-only identities without email", async () => {
    await exercise(async (tx) => {
      const [row] = await tx`insert into staff (name, role) values ('Gate fixture', 'gate')
        returning pin_hash, pin_issued_at, pin_expires_at, credential_version, revoked_at`;
      expect(row).toMatchObject({
        pin_hash: null,
        pin_issued_at: null,
        pin_expires_at: null,
        credential_version: 1,
        revoked_at: null,
      });
    });
  });

  it("rejects raw PINs, incomplete credentials and expiry before issuance", async () => {
    await exercise(async (tx) => {
      const id = randomUUID();
      await tx`insert into staff (id, name, email, role) values (${id}, 'Gate', ${id + "@example.test"}, 'gate')`;
      await expect(
        tx.savepoint((sp) => sp`update staff set pin_hash = '123456' where id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint((sp) => sp`update staff set pin_hash = ${hash} where id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint(
          (sp) =>
            sp`update staff set pin_hash = ${hash}, pin_issued_at = '2026-12-19T00:00:00Z', pin_expires_at = '2026-12-18T00:00:00Z' where id = ${id}`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await tx`update staff set pin_hash = ${hash}, pin_issued_at = '2026-12-19T00:00:00Z', pin_expires_at = '2026-12-20T06:00:00Z', revoked_at = now() where id = ${id}`;
      await expect(
        tx.savepoint((sp) => sp`update staff set credential_version = 0 where id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        tx.savepoint((sp) => sp`update staff set role = 'admin' where id = ${id}`),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("retains device identity across rename/revocation and enforces staff references", async () => {
    await exercise(async (tx) => {
      const [device] =
        await tx`insert into registered_devices (name, role) values ('Gate phone', 'gate') returning id`;
      expect(device?.id).toMatch(/^[0-9a-f-]{36}$/);
      await tx`update registered_devices set name = 'North gate', revoked_at = now() where id = ${device?.id}`;
      const [renamed] =
        await tx`select name, revoked_at from registered_devices where id = ${device?.id}`;
      expect(renamed?.name).toBe("North gate");
      expect(renamed?.revoked_at).toBeInstanceOf(Date);
      await expect(
        tx.savepoint(
          (sp) =>
            sp`update registered_devices set registered_by_staff_id = ${randomUUID()} where id = ${device?.id}`,
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects invalid device roles, identifiers and empty names", async () => {
    await exercise(async (tx) => {
      for (const [id, name, role] of [
        ["bad id", "Gate", "gate"],
        ["valid-id", " ", "gate"],
        ["admin-device", "Admin", "admin"],
      ]) {
        await expect(
          tx.savepoint(
            (sp) =>
              sp`insert into registered_devices (id, name, role) values (${id ?? ""}, ${name ?? ""}, ${role ?? ""})`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
      }
    });
  });

  it("keeps RLS enabled without browser access policies", async () => {
    const [row] =
      await db`select relrowsecurity from pg_class where oid = 'public.registered_devices'::regclass`;
    expect(row?.relrowsecurity).toBe(true);
    const policies =
      await db`select policyname from pg_policies where schemaname = 'public' and tablename = 'registered_devices'`;
    expect(policies).toHaveLength(0);
  });
});
