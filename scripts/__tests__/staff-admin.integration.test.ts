import { randomInt } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";

import type * as StaffRepository from "../../src/modules/admin/server/staff-repository";
import type * as StaffPin from "../../src/modules/shared/server/staff-pin";

type Repo = typeof StaffRepository;
type Pin = typeof StaffPin;

describe.runIf(process.env.RUN_STAFF_ADMIN_DB_TESTS === "1")("admin staff PIN lifecycle", () => {
  let sql: Sql;
  let database: Db;
  let repo: Repo;
  let pins: Pin;
  let saved: { event_date: string; time_zone: string | null } | undefined;
  const tag = "TICKET-096 fixture " + randomInt(100000, 900000);
  const now = new Date("2026-12-01T12:00:00Z");

  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 4, connect_timeout: 10 });
    database = drizzle(sql, { schema }) as unknown as Db;
    repo = await import("../../src/modules/admin/server/staff-repository");
    pins = await import("../../src/modules/shared/server/staff-pin");
    [saved] = await sql<
      { event_date: string; time_zone: string | null }[]
    >`select event_date::text, time_zone from event_settings where id = 1`;
    await sql`insert into event_settings (id, event_date, time_zone) values (1, '2026-12-19', 'Africa/Lagos')
      on conflict (id) do update set event_date = '2026-12-19', time_zone = 'Africa/Lagos'`;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      await sql`delete from staff where name like ${tag + "%"}`;
      if (saved)
        await sql`update event_settings set event_date = ${saved.event_date}, time_zone = ${saved.time_zone} where id = 1`;
    } finally {
      await sql.end();
    }
  });
  const row = async (id: string) =>
    (
      await sql<
        {
          pin_hash: string | null;
          pin_expires_at: Date | null;
          revoked_at: Date | null;
          credential_version: number;
        }[]
      >`select pin_hash, pin_expires_at, revoked_at, credential_version from staff where id = ${id}`
    )[0];

  it("shows the PIN once and stores only its hash, expiring 06:00 venue time after the wedding", async () => {
    const id = (await repo.addStaff(database, tag + " Ada", "kitchen")) ?? "";
    const result = await repo.issueStaffPin(database, id, { now });
    expect(result.status).toBe("issued");
    if (result.status !== "issued") return;
    expect(result.pin).toMatch(/^\d{6}$/);
    const stored = await row(id);
    expect(stored?.pin_hash).not.toContain(result.pin);
    expect(stored?.pin_hash).toMatch(/^scrypt\$/);
    expect(await pins.verifyStaffPin(result.pin, stored?.pin_hash ?? "")).toBe(true);
    expect(new Date(stored?.pin_expires_at ?? 0).toISOString()).toBe("2026-12-20T05:00:00.000Z");
    // Nothing that reads the list ever gets the PIN back.
    expect(JSON.stringify(await repo.listStaff(database, now))).not.toContain(result.pin);
  });

  it("resets with a new version, so sessions from the old PIN stop working", async () => {
    const id = (await repo.addStaff(database, tag + " Bola", "bar")) ?? "";
    await repo.issueStaffPin(database, id, { now });
    const before = await row(id);
    const again = await repo.issueStaffPin(database, id, { now });
    const after = await row(id);
    expect(again.status).toBe("issued");
    expect(after?.credential_version).toBe((before?.credential_version ?? 0) + 1);
    expect(after?.pin_hash).not.toBe(before?.pin_hash);
  });

  it("revokes at once: no PIN, a newer version and a revoked mark", async () => {
    const id = (await repo.addStaff(database, tag + " Chidi", "gate")) ?? "";
    await repo.issueStaffPin(database, id, { now });
    const before = await row(id);
    expect(await repo.revokeStaff(database, id, now)).toBe(true);
    const after = await row(id);
    expect(after).toMatchObject({ pin_hash: null, pin_expires_at: null });
    expect(after?.revoked_at).not.toBeNull();
    expect(after?.credential_version).toBe((before?.credential_version ?? 0) + 1);
    const [listed] = (await repo.listStaff(database, now)).filter((member) => member.id === id);
    expect(listed).toMatchObject({ revoked: true, pinActive: false });
  });

  it("never gives two people the same PIN", async () => {
    const first = (await repo.addStaff(database, tag + " Dayo", "kitchen")) ?? "";
    const second = (await repo.addStaff(database, tag + " Efe", "kitchen")) ?? "";
    const taken = await repo.issueStaffPin(database, first, { now, pin: () => "123456" });
    expect(taken.status).toBe("issued");
    const candidates = ["123456", "654321"];
    const result = await repo.issueStaffPin(database, second, {
      now,
      pin: () => candidates.shift() ?? "000000",
    });
    expect(result).toMatchObject({ status: "issued", pin: "654321" });
  });

  it("refuses without a venue time zone, or after the event", async () => {
    const id = (await repo.addStaff(database, tag + " Femi", "bar")) ?? "";
    expect(
      (await repo.issueStaffPin(database, id, { now: new Date("2026-12-21T00:00:00Z") })).status,
    ).toBe("event-over");
    await sql`update event_settings set time_zone = null where id = 1`;
    try {
      expect((await repo.issueStaffPin(database, id, { now })).status).toBe("no-time-zone");
    } finally {
      await sql`update event_settings set time_zone = 'Africa/Lagos' where id = 1`;
    }
  });
});
