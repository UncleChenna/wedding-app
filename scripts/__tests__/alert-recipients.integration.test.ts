import { randomInt } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { alertRecipients as AlertRecipients } from "../../src/modules/ordering/server/alert-recipients";
import type { setAlertContact as SetAlertContact } from "../../src/modules/admin/server/staff-repository";

/** TICKET-086 against Postgres: only opted-in staff of the matching station receive alerts. */
describe.runIf(process.env.RUN_ALERT_RECIPIENT_DB_TESTS === "1")("order alert recipients", () => {
  let sql: Sql;
  let database: Db;
  let recipients: typeof AlertRecipients;
  let setContact: typeof SetAlertContact;
  const tag = "TICKET-086 fixture " + randomInt(100000, 900000);
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 2, connect_timeout: 10 });
    database = drizzle(sql, { schema }) as unknown as Db;
    recipients = (await import("../../src/modules/ordering/server/alert-recipients"))
      .alertRecipients;
    setContact = (await import("../../src/modules/admin/server/staff-repository")).setAlertContact;
    const people = [
      ["kitchenOn", "kitchen"],
      ["kitchenOff", "kitchen"],
      ["kitchenRevoked", "kitchen"],
      ["barOn", "bar"],
      ["gate", "gate"],
    ] as const;
    for (const [key, role] of people) {
      const [row] = await sql<
        { id: string }[]
      >`insert into staff (name, role) values (${`${tag} ${key}`}, ${role}) returning id`;
      ids[key] = row?.id ?? "";
    }
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      await sql`delete from staff where name like ${tag + "%"}`;
    } finally {
      await sql.end();
    }
  });

  it("returns only opted-in, active staff of the station, with their numbers", async () => {
    expect(
      await setContact(database, ids.kitchenOn ?? "", { number: "+2348031234567", optIn: true }),
    ).toBe(true);
    expect(
      await setContact(database, ids.kitchenOff ?? "", { number: "+2348031234568", optIn: false }),
    ).toBe(true);
    await setContact(database, ids.kitchenRevoked ?? "", { number: "+2348031234569", optIn: true });
    await sql`update staff set revoked_at = now() where id = ${ids.kitchenRevoked ?? ""}`;
    await setContact(database, ids.barOn ?? "", { number: "+447700900123", optIn: true });

    const mine = (rows: { name: string; number: string }[]) =>
      rows.filter((row) => row.name.startsWith(tag)).map((row) => [row.name, row.number]);
    expect(mine(await recipients(database, "kitchen"))).toEqual([
      [`${tag} kitchenOn`, "+2348031234567"],
    ]);
    expect(mine(await recipients(database, "bar"))).toEqual([[`${tag} barOn`, "+447700900123"]]);
  });

  it("can't opt in gate staff, and the database refuses an opt-in without a number", async () => {
    expect(
      await setContact(database, ids.gate ?? "", { number: "+2348031234500", optIn: true }),
    ).toBe(false);
    await expect(
      sql`update staff set alerts_opt_in = true, whatsapp_number = null where id = ${ids.kitchenOff ?? ""}`,
    ).rejects.toThrow(/staff_alerts_need_number/);
    await expect(
      sql`update staff set whatsapp_number = '0803' where id = ${ids.kitchenOff ?? ""}`,
    ).rejects.toThrow(/staff_whatsapp_number_e164/);
  });
});
