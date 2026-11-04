import { randomBytes, randomUUID } from "node:crypto";

import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { assertDatabaseTarget } from "../database-target";

let db: Sql;
describe.runIf(process.env.RUN_STAFF_DB_TESTS === "1")("staff authentication", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    db = postgres(url, { max: 2, prepare: false });
  });
  afterAll(async () => {
    if (db) await db.end();
  });

  it("signs in without leaking credentials and rechecks roles, expiry and revocation", async () => {
    const { hashStaffPin } = await import("../../src/modules/shared/server/staff-pin");
    const { signInStaff, authenticateStaff } =
      await import("../../src/modules/shared/server/staff-auth");
    const { signStaffSession } = await import("../../src/modules/shared/server/staff-session");
    const id = randomUUID();
    const duplicateId = randomUUID();
    const device = randomBytes(32).toString("hex");
    const key = randomBytes(32);
    const hash = await hashStaffPin("012345");
    // Refuse to replace any existing settings; this suite requires an empty isolated fixture.
    await db`insert into event_settings(id,event_date,time_zone,venue)
      values (1,'2099-12-19','Africa/Lagos',${id})`;
    try {
      await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at)
        values (${id},'Synthetic gate','gate',${hash},now() - interval '1 minute','2099-12-21T00:00:00Z')`;
      expect(await signInStaff("999999", "gate", device)).toEqual({ status: "wrong" });
      expect(await signInStaff("012345", "kitchen", device)).toEqual({ status: "wrong" });
      const result = await signInStaff("012345", "gate", device);
      expect(result.status).toBe("success");
      if (result.status !== "success") throw new Error("Expected successful synthetic sign-in");
      expect(result.value).toEqual({
        staffId: id,
        role: "gate",
        credentialVersion: 1,
        expiresAt: new Date("2099-12-20T05:00:00Z"),
      });
      const { expiresAt, ...identity } = result.value;
      const token = signStaffSession(identity, device, expiresAt, key);
      expect(await authenticateStaff(token, device, "gate", key)).toEqual(identity);
      expect(await authenticateStaff(token, device, "kitchen", key)).toBeNull();
      await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at)
        values (${duplicateId},'Synthetic duplicate','kitchen',${hash},now() - interval '1 minute','2099-12-21T00:00:00Z')`;
      expect(await signInStaff("012345", "gate", device)).toEqual({ status: "wrong" });
      await db`delete from staff where id = ${duplicateId}`;
      await db`update registered_devices set revoked_at = now() where id = ${device}`;
      expect(await authenticateStaff(token, device, "gate", key)).toBeNull();
      await db`update registered_devices set revoked_at = null where id = ${device}`;
      await db`update staff set credential_version = 2 where id = ${id}`;
      expect(await authenticateStaff(token, device, "gate", key)).toBeNull();
      await db`update staff set pin_issued_at = now() - interval '2 hours', pin_expires_at = now() - interval '1 hour' where id = ${id}`;
      expect(await signInStaff("012345", "gate", device)).toEqual({ status: "expired" });
      await db`update event_settings set time_zone = null where id = 1 and venue = ${id}`;
      expect(await signInStaff("012345", "gate", device)).toEqual({ status: "unavailable" });
    } finally {
      await db`delete from registered_devices where id = ${device}`;
      await db`delete from staff_pin_attempts where device_id = ${device}`;
      await db`delete from staff where id = ${id}`;
      await db`delete from staff where id = ${duplicateId}`;
      await db`delete from event_settings where id = 1 and venue = ${id}`;
    }
  });
});
