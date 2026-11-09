import { randomInt } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import {
  assignSeatingTable,
  deleteSeatingTable,
  readSeatingPlan,
  saveSeatingTable,
} from "../../src/modules/admin/server/seating-repository";
import { seatingTableVersion } from "../../src/modules/admin/lib/seating";
import { findStoredPass } from "../../src/modules/checkin/server/pass-repository";

describe.runIf(process.env.RUN_SEATING_DB_TESTS === "1")("seating persistence", () => {
  let sql: Sql;
  let database: Db;
  const tag = `TICKET-093-${randomInt(100000, 999999)}`;
  let number = randomInt(100000, 800000);
  const tableIds: string[] = [];
  const invitationIds: string[] = [];
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 6, connect_timeout: 10 });
    database = drizzle(sql, { schema }) as Db;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      if (tableIds.length) await sql`delete from orders where table_id in ${sql(tableIds)}`;
      if (invitationIds.length)
        await sql`delete from invitations where id in ${sql(invitationIds)}`;
      if (tableIds.length) await sql`delete from tables where id in ${sql(tableIds)}`;
    } finally {
      await sql.end();
    }
  });
  async function table(capacity = 2) {
    const [row] = await database
      .insert(schema.tables)
      .values({ number: number++, capacity, name: tag })
      .returning();
    if (!row) throw new Error("Missing synthetic table");
    tableIds.push(row.id);
    return row;
  }
  async function party() {
    const [row] = await database
      .insert(schema.invitations)
      .values({ householdName: tag, status: "rsvp_yes" })
      .returning();
    if (!row) throw new Error("Missing synthetic invitation");
    invitationIds.push(row.id);
    await database.insert(schema.guests).values([
      { invitationId: row.id, name: "Primary", isPrimary: true },
      { invitationId: row.id, name: "Companion", mealChoice: "preserve" },
    ]);
    await database
      .insert(schema.rsvps)
      .values({ invitationId: row.id, attending: true, countAttending: 2 });
    return row;
  }
  it("assigns every member, preserves reply and meal, and updates the current pass through move/renumber/unassign", async () => {
    const a = await table();
    const b = await table();
    const p = await party();
    expect(
      await assignSeatingTable(database, {
        invitationId: p.id,
        expectedTableId: null,
        tableId: a.id,
      }),
    ).toMatchObject({ ok: true });
    expect((await findStoredPass(database, p.id))?.tableNumber).toBe(a.number);
    expect(await sql`select table_id from guests where invitation_id = ${p.id}`).toEqual([
      { table_id: a.id },
      { table_id: a.id },
    ]);
    expect(
      await assignSeatingTable(database, {
        invitationId: p.id,
        expectedTableId: a.id,
        tableId: b.id,
      }),
    ).toMatchObject({ ok: true });
    expect((await findStoredPass(database, p.id))?.tableNumber).toBe(b.number);
    const next = number++;
    expect(
      await saveSeatingTable(database, {
        id: b.id,
        expected: seatingTableVersion(b),
        values: { number: next, name: "Renamed", capacity: 1 },
      }),
    ).toMatchObject({ ok: true, message: expect.stringContaining("over capacity") });
    expect((await findStoredPass(database, p.id))?.tableNumber).toBe(next);
    expect(
      await assignSeatingTable(database, {
        invitationId: p.id,
        expectedTableId: b.id,
        tableId: null,
      }),
    ).toMatchObject({ ok: true });
    expect((await findStoredPass(database, p.id))?.tableNumber).toBeNull();
    expect(await sql`select count_attending from rsvps where invitation_id = ${p.id}`).toEqual([
      { count_attending: 2 },
    ]);
    expect(
      await sql`select meal_choice from guests where invitation_id = ${p.id} and not is_primary`,
    ).toEqual([{ meal_choice: "preserve" }]);
  });
  it("rejects stale writes and preserves occupied tables and order history", async () => {
    const t = await table();
    const p = await party();
    await assignSeatingTable(database, {
      invitationId: p.id,
      expectedTableId: null,
      tableId: t.id,
    });
    expect(
      await assignSeatingTable(database, {
        invitationId: p.id,
        expectedTableId: null,
        tableId: null,
      }),
    ).toMatchObject({ ok: false });
    expect(
      await deleteSeatingTable(database, { id: t.id, expected: seatingTableVersion(t) }),
    ).toMatchObject({ ok: false, message: expect.stringContaining("unassign") });
    await assignSeatingTable(database, {
      invitationId: p.id,
      expectedTableId: t.id,
      tableId: null,
    });
    await database.insert(schema.orders).values({ tableId: t.id });
    expect(
      await deleteSeatingTable(database, { id: t.id, expected: seatingTableVersion(t) }),
    ).toMatchObject({ ok: false, message: expect.stringContaining("order history") });
    expect(
      await saveSeatingTable(database, {
        id: t.id,
        expected: "stale",
        values: { number: t.number, name: "Overwrite", capacity: 9 },
      }),
    ).toMatchObject({ ok: false });
  });
  it("creates and deletes an empty table, rejects duplicate numbers and invalid capacity", async () => {
    const n = number++;
    expect(
      await saveSeatingTable(database, {
        id: null,
        expected: null,
        values: { number: n, name: tag, capacity: 4 },
      }),
    ).toMatchObject({ ok: true });
    const t = (await readSeatingPlan(database)).tables.find((row) => row.number === n);
    if (!t) throw new Error("Missing added table");
    tableIds.push(t.id);
    expect(
      await saveSeatingTable(database, {
        id: null,
        expected: null,
        values: { number: n, name: tag, capacity: 4 },
      }),
    ).toMatchObject({ ok: false, fields: { number: expect.any(String) } });
    expect(
      await saveSeatingTable(database, {
        id: null,
        expected: null,
        values: { number: number++, name: tag, capacity: 0 },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await deleteSeatingTable(database, { id: t.id, expected: seatingTableVersion(t) }),
    ).toMatchObject({ ok: true });
  });
  it("serializes simultaneous households so the second successful assignment warns", async () => {
    const t = await table(3);
    const a = await party();
    const b = await party();
    // Hold the target so both independent connections reach the same contention point.
    let release: () => void = () => {};
    let locked: () => void = () => {};
    const acquired = new Promise<void>((resolve) => {
      locked = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const blocker = sql.begin(async (tx) => {
      await tx`select id from tables where id = ${t.id} for update`;
      locked();
      await gate;
    });
    await acquired;
    const work = [a, b].map((p) =>
      assignSeatingTable(database, { invitationId: p.id, expectedTableId: null, tableId: t.id }),
    );
    release();
    await blocker;
    const results = await Promise.all(work);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.filter((result) => result.message.includes("over capacity"))).toHaveLength(1);
    const plan = await readSeatingPlan(database);
    expect(plan.parties.filter((p) => p.tableId === t.id)).toHaveLength(2);
  });
});
