import { randomBytes } from "node:crypto";

import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { assertDatabaseTarget } from "../database-target";

let db: Sql;
const rollback = new Error("rollback attempt fixture");

describe.runIf(process.env.RUN_STAFF_DB_TESTS === "1")("staff attempt storage", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    db = postgres(url, { max: 2, prepare: false });
  });
  afterAll(async () => {
    if (db) await db.end();
  });

  it("bounds failed attempts and keeps anonymous device counters behind RLS", async () => {
    try {
      await db.begin(async (tx) => {
        const device = randomBytes(32).toString("hex");
        await tx`insert into staff_pin_attempts(device_id, failures, window_started_at)
          values (${device}, 0, now())`;
        await tx`update staff_pin_attempts set failures = 5 where device_id = ${device}`;
        for (const failures of [-1, 6]) {
          await expect(
            tx.savepoint(
              (sp) => sp`update staff_pin_attempts set failures = ${failures}
            where device_id = ${device}`,
            ),
          ).rejects.toMatchObject({ code: "23514" });
        }
        await expect(
          tx.savepoint(
            (sp) => sp`insert into staff_pin_attempts(device_id, failures, window_started_at)
          values ('123456', 0, now())`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
        const [row] =
          await tx`select relrowsecurity from pg_class where oid = 'public.staff_pin_attempts'::regclass`;
        expect(row?.relrowsecurity).toBe(true);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it("serializes simultaneous failures, locks the fifth and resets after ten minutes", async () => {
    const { withStaffPinAttempt } = await import("../../src/modules/shared/server/staff-attempts");
    const device = randomBytes(32).toString("hex");
    let checks = 0;
    try {
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          withStaffPinAttempt(device, async () => {
            checks++;
            return { status: "wrong" };
          }),
        ),
      );
      expect(checks).toBe(5);
      expect(results.filter((result) => result.status === "wrong")).toHaveLength(4);
      expect(results.filter((result) => result.status === "locked")).toHaveLength(4);
      await db`update staff_pin_attempts set window_started_at = now() - interval '10 minutes' where device_id = ${device}`;
      expect(await withStaffPinAttempt(device, async () => ({ status: "expired" }))).toEqual({
        status: "expired",
      });
      expect(
        await withStaffPinAttempt(device, async () => ({
          status: "success",
          value: "authenticated",
        })),
      ).toEqual({ status: "success", value: "authenticated" });
      const [row] = await db`select failures from staff_pin_attempts where device_id = ${device}`;
      expect(row?.failures).toBe(0);
    } finally {
      await db`delete from staff_pin_attempts where device_id = ${device}`;
    }
  });
});
