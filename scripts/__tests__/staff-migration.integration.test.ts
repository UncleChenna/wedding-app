import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";

let db: Sql;
const rollback = new Error("rollback staff migration fixture");
async function apply(tx: TransactionSql, schema: string, file: string) {
  const source = readFileSync(file, "utf8").replaceAll('"public".', `"${schema}".`);
  for (const statement of source.split("--> statement-breakpoint")) {
    if (statement.trim()) await tx.unsafe(statement);
  }
}
async function sandbox(run: (tx: TransactionSql, schema: string) => Promise<void>) {
  const schema = "staff_test_" + randomUUID().replaceAll("-", "");
  try {
    await db.begin(async (tx) => {
      await tx.unsafe(`create schema "${schema}"`);
      await tx.unsafe(`set local search_path to "${schema}", pg_catalog`);
      await apply(tx, schema, "drizzle/0000_init.sql");
      await run(tx, schema);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}
const migration = "drizzle/0009_staff-device-identities.sql";
describe.runIf(process.env.RUN_STAFF_DB_TESTS === "1")("staff migration preservation", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    db = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  });
  afterAll(async () => {
    if (db) await db.end();
  });
  it("migrates an empty bootstrap without provisioning credentials or devices", async () => {
    await sandbox(async (tx, schema) => {
      await apply(tx, schema, migration);
      expect(await tx`select id from staff`).toHaveLength(0);
      expect(await tx`select id from registered_devices`).toHaveLength(0);
      const [rls] =
        await tx`select relrowsecurity from pg_class where oid = ${schema + ".registered_devices"}::regclass`;
      expect(rls?.relrowsecurity).toBe(true);
    });
  });
  it("preserves staff Auth links, email, invitation and historical scan values", async () => {
    await sandbox(async (tx, schema) => {
      const staff = randomUUID(),
        invitation = randomUUID(),
        guest = randomUUID();
      await tx`insert into staff(id,auth_user_id,name,email,role) values (${staff},${randomUUID()},'Synthetic gate','migration@example.test','gate')`;
      await tx`insert into invitations(id,code,household_name) values (${invitation},'migration-fixture','Synthetic household')`;
      await tx`insert into guests(id,invitation_id,first_name,last_name,qr_token) values (${guest},${invitation},'Synthetic','Guest',${randomUUID()})`;
      await tx`insert into check_ins(guest_id,staff_id,checked_in_at,device_id,client_event_id) values (${guest},${staff},'2026-10-01T12:00:00Z','legacy-device',${randomUUID()})`;
      const staffBefore = await tx`select to_jsonb(s) as row from staff s`;
      const invitationsBefore = await tx`select to_jsonb(i) as row from invitations i`;
      const scansBefore = await tx`select to_jsonb(c) as row from check_ins c`;
      await apply(tx, schema, migration);
      expect(
        await tx`select to_jsonb(s)-'pin_hash'-'pin_issued_at'-'pin_expires_at'-'credential_version'-'revoked_at' as row from staff s`,
      ).toEqual(staffBefore);
      expect(await tx`select to_jsonb(i) as row from invitations i`).toEqual(invitationsBefore);
      expect(await tx`select to_jsonb(c) as row from check_ins c`).toEqual(scansBefore);
      const [identity] =
        await tx`select pin_hash,credential_version,revoked_at from staff where id=${staff}`;
      expect(identity).toMatchObject({ pin_hash: null, credential_version: 1, revoked_at: null });
      expect(await tx`select id from registered_devices`).toHaveLength(0);
    });
  });
});
