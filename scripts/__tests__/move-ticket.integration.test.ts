import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { moveTicket as Move } from "../../src/modules/ordering/server/move-ticket";

/** TICKET-078: RUN_TICKET_MOVE_DB_TESTS=1 vitest run scripts/__tests__/move-ticket.integration.test.ts */
let sql: Sql;
let database: Db;
let moveTicket: typeof Move;
const tag = "TICKET-078 fixture " + randomInt(100000, 900000);
const tableIds: string[] = [];
const menu = { meal: randomUUID(), drink: randomUUID() };
const staffId = randomUUID();
const deviceId = randomUUID();
const kitchen = { station: "kitchen" as const, staffId, deviceId };

/** One guest order with a kitchen ticket and, optionally, a bar ticket. */
async function order(withDrink = false) {
  const [table] = await sql<{ id: string }[]>`insert into tables(number, name, capacity)
    values (${randomInt(100000, 900000)}, ${tag}, 8) returning id`;
  tableIds.push(table?.id ?? "");
  const [created] = await sql<
    { id: string }[]
  >`insert into orders(table_id) values (${table?.id ?? ""}) returning id`;
  const id = created?.id ?? "";
  const [food] = await sql<{ id: string }[]>`insert into station_orders(order_id, station)
    values (${id}, 'kitchen') returning id`;
  await sql`insert into order_items(order_id, station_order_id, menu_item_id, quantity)
    values (${id}, ${food?.id ?? ""}, ${menu.meal}, 1)`;
  let drink: string | null = null;
  if (withDrink) {
    const [row] = await sql<{ id: string }[]>`insert into station_orders(order_id, station)
      values (${id}, 'bar') returning id`;
    drink = row?.id ?? null;
    await sql`insert into order_items(order_id, station_order_id, menu_item_id, quantity)
      values (${id}, ${drink ?? ""}, ${menu.drink}, 1)`;
  }
  return { orderId: id, food: food?.id ?? "", drink };
}
const statusOf = async (orderId: string) =>
  (await sql<{ status: string }[]>`select status from orders where id = ${orderId}`)[0]?.status;

describe.runIf(process.env.RUN_TICKET_MOVE_DB_TESTS === "1")("ticket moves", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 6, connect_timeout: 10, onnotice: () => {} });
    database = drizzle(sql, { schema }) as unknown as Db;
    moveTicket = (await import("../../src/modules/ordering/server/move-ticket")).moveTicket;
    await sql`insert into staff(id, name, role) values (${staffId}, ${tag}, 'kitchen')`;
    await sql`insert into registered_devices(id, name, role, registered_by_staff_id)
      values (${deviceId}, ${tag}, 'kitchen', ${staffId})`;
    await sql`insert into menu_items(id, name, category_v2, station, max_per_order, is_available) values
      (${menu.meal}, ${tag + " meal"}, 'meal', 'kitchen', 5, true),
      (${menu.drink}, ${tag + " drink"}, 'soft_drink', 'bar', 5, true)`;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      await sql`delete from orders where table_id in ${sql(tableIds)}`;
      await sql`delete from tables where id in ${sql(tableIds)}`;
      await sql`delete from menu_items where id in ${sql(Object.values(menu))}`;
      await sql`delete from registered_devices where id = ${deviceId}`;
      await sql`delete from staff where id = ${staffId}`;
    } finally {
      await sql.end();
    }
  });

  it("moves through preparing to served, timestamping every move with who and where", async () => {
    const { orderId, food } = await order();
    const first = await moveTicket(database, kitchen, {
      stationOrderId: food,
      from: "received",
      to: "preparing",
    });
    expect(first).toMatchObject({ status: "moved", ticketStatus: "preparing" });
    expect(await statusOf(orderId)).toBe("preparing");
    const second = await moveTicket(database, kitchen, {
      stationOrderId: food,
      from: "preparing",
      to: "served",
    });
    expect(second.status).toBe("moved");
    expect(await statusOf(orderId)).toBe("served");
    const events = await sql<
      {
        from_status: string;
        to_status: string;
        staff_id: string;
        device_id: string;
        created_at: Date;
      }[]
    >`
      select from_status, to_status, staff_id, device_id, created_at from station_order_events
      where station_order_id = ${food} order by created_at`;
    expect(events.map((e) => [e.from_status, e.to_status])).toEqual([
      ["received", "preparing"],
      ["preparing", "served"],
    ]);
    for (const event of events) {
      expect(event).toMatchObject({ staff_id: staffId, device_id: deviceId });
      expect(Number.isNaN(Date.parse(String(event.created_at)))).toBe(false);
    }
  });

  it("refuses illegal moves server-side and leaves everything as it was", async () => {
    const { orderId, food } = await order();
    await moveTicket(database, kitchen, { stationOrderId: food, from: "received", to: "served" });
    for (const to of ["received", "preparing", "cancelled"] as const)
      expect(
        await moveTicket(database, kitchen, {
          stationOrderId: food,
          from: "served",
          to,
          reason: "x",
        }),
      ).toEqual({ status: "illegal" });
    expect(await statusOf(orderId)).toBe("served");
    const [count] = await sql<
      { n: number }[]
    >`select count(*)::int as n from station_order_events where station_order_id = ${food}`;
    expect(count?.n).toBe(1);
  });

  it("lets only one of two racing tablets move a ticket", async () => {
    const { food } = await order();
    const results = await Promise.all([
      moveTicket(database, kitchen, { stationOrderId: food, from: "received", to: "served" }),
      moveTicket(database, kitchen, {
        stationOrderId: food,
        from: "received",
        to: "cancelled",
        reason: "Gone",
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(["moved", "stale"]);
  });

  it("keeps a reason with each cancel, and an order stays open while its bar ticket is", async () => {
    const { orderId, food, drink } = await order(true);
    expect(
      await moveTicket(database, kitchen, {
        stationOrderId: food,
        from: "received",
        to: "cancelled",
        reason: "Guest left",
      }),
    ).toMatchObject({ status: "moved" });
    const [event] = await sql<
      { reason: string }[]
    >`select reason from station_order_events where station_order_id = ${food}`;
    expect(event?.reason).toBe("Guest left");
    expect(await statusOf(orderId)).toBe("received");
    // The kitchen can't touch the bar's ticket.
    expect(
      await moveTicket(database, kitchen, {
        stationOrderId: drink ?? "",
        from: "received",
        to: "served",
      }),
    ).toEqual({ status: "not_found" });
    // The database refuses a cancel with no reason even if code tried one.
    await expect(
      sql`insert into station_order_events(station_order_id, from_status, to_status) values (${food}, 'received', 'cancelled')`,
    ).rejects.toMatchObject({ code: "23514" });
  });
});
