import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { readHostBoard as Read } from "../../src/modules/ordering/server/host-board";
import type { serveHostTicket as Serve } from "../../src/modules/ordering/server/host-serve";
import type { setHostTables as Assign } from "../../src/modules/admin/server/staff-repository";

/** TICKET-082: RUN_HOST_DB_TESTS=1 vitest run scripts/__tests__/host-board.integration.test.ts */
let sql: Sql;
let database: Db;
let readHostBoard: typeof Read;
let serveHostTicket: typeof Serve;
let setHostTables: typeof Assign;
const tag = "TICKET-082 fixture " + randomInt(100000, 900000);
const tables: { id: string; number: number }[] = [];
const menu = { meal: randomUUID(), drink: randomUUID() };
const hostId = randomUUID();
const kitchenId = randomUUID();
const deviceId = randomUUID();
const host = { staffId: hostId, deviceId };

async function table() {
  const number = randomInt(100000, 900000);
  const [row] = await sql<{ id: string }[]>`insert into tables(number, name, capacity)
    values (${number}, ${tag}, 8) returning id`;
  const created = { id: row?.id ?? "", number };
  tables.push(created);
  return created;
}

/** One order at a table with a kitchen ticket and a bar ticket. */
async function order(tableId: string) {
  const [created] = await sql<
    { id: string }[]
  >`insert into orders(table_id) values (${tableId}) returning id`;
  const orderId = created?.id ?? "";
  const tickets: Record<"kitchen" | "bar", string> = { kitchen: "", bar: "" };
  for (const [station, item] of [
    ["kitchen", menu.meal],
    ["bar", menu.drink],
  ] as const) {
    const [row] = await sql<{ id: string }[]>`insert into station_orders(order_id, station)
      values (${orderId}, ${station}) returning id`;
    tickets[station] = row?.id ?? "";
    await sql`insert into order_items(order_id, station_order_id, menu_item_id, quantity)
      values (${orderId}, ${tickets[station]}, ${item}, 2)`;
  }
  return { orderId, ...tickets };
}

describe.runIf(process.env.RUN_HOST_DB_TESTS === "1")("table host board", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 6, connect_timeout: 10, onnotice: () => {} });
    database = drizzle(sql, { schema }) as unknown as Db;
    readHostBoard = (await import("../../src/modules/ordering/server/host-board")).readHostBoard;
    serveHostTicket = (await import("../../src/modules/ordering/server/host-serve"))
      .serveHostTicket;
    setHostTables = (await import("../../src/modules/admin/server/staff-repository")).setHostTables;
    await sql`insert into staff(id, name, role) values
      (${hostId}, ${tag + " host"}, 'host'), (${kitchenId}, ${tag + " cook"}, 'kitchen')`;
    await sql`insert into registered_devices(id, name, role, registered_by_staff_id)
      values (${deviceId}, ${tag}, 'host', ${hostId})`;
    await sql`insert into menu_items(id, name, category_v2, station, max_per_order, is_available) values
      (${menu.meal}, ${tag + " meal"}, 'meal', 'kitchen', 5, true),
      (${menu.drink}, ${tag + " drink"}, 'soft_drink', 'bar', 5, true)`;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      const ids = tables.map((row) => row.id);
      if (ids.length) {
        await sql`delete from orders where table_id in ${sql(ids)}`;
        await sql`delete from tables where id in ${sql(ids)}`;
      }
      await sql`delete from menu_items where id in ${sql(Object.values(menu))}`;
      await sql`delete from registered_devices where id = ${deviceId}`;
      await sql`delete from staff where id in ${sql([hostId, kitchenId])}`;
    } finally {
      await sql.end();
    }
  });

  it("assigns real tables only, and only to table hosts", async () => {
    const mine = await table();
    expect(await setHostTables(database, hostId, [mine.number, 1_999_999])).toEqual({
      status: "unknown",
      numbers: [1_999_999],
    });
    expect(await setHostTables(database, kitchenId, [mine.number])).toEqual({
      status: "missing",
    });
    expect(await setHostTables(database, hostId, [mine.number])).toEqual({
      status: "saved",
      count: 1,
    });
    expect(await setHostTables(database, hostId, [])).toEqual({ status: "saved", count: 0 });
  });

  it("shows a host food and drinks for their own tables only", async () => {
    const [mine, theirs] = [await table(), await table()];
    await setHostTables(database, hostId, [mine.number]);
    const ours = await order(mine.id);
    await order(theirs.id);
    const board = await readHostBoard(database, hostId);
    expect(board.tables).toEqual([{ number: mine.number, name: tag }]);
    expect(board.tickets.map((ticket) => [ticket.id, ticket.station]).sort()).toEqual(
      [
        [ours.kitchen, "kitchen"],
        [ours.bar, "bar"],
      ].sort(),
    );
    expect(board.tickets.every((ticket) => ticket.table.number === mine.number)).toBe(true);
  });

  it("lets a host serve their table's ticket, recorded under the host", async () => {
    const mine = await table();
    await setHostTables(database, hostId, [mine.number]);
    const { orderId, kitchen, bar } = await order(mine.id);
    expect(
      await serveHostTicket(database, host, { stationOrderId: kitchen, from: "received" }),
    ).toMatchObject({ status: "moved", ticketStatus: "served" });
    expect(
      await serveHostTicket(database, host, { stationOrderId: bar, from: "received" }),
    ).toMatchObject({ status: "moved" });
    const [row] = await sql<{ status: string }[]>`select status from orders where id = ${orderId}`;
    expect(row?.status).toBe("served");
    const [event] = await sql<{ staff_id: string; to_status: string }[]>`
      select staff_id, to_status from station_order_events where station_order_id = ${kitchen}`;
    expect(event).toEqual({ staff_id: hostId, to_status: "served" });
    expect((await readHostBoard(database, hostId)).tickets).toEqual([]);
  });

  it("refuses another table's ticket and a stale serve", async () => {
    const [mine, theirs] = [await table(), await table()];
    await setHostTables(database, hostId, [mine.number]);
    const other = await order(theirs.id);
    expect(
      await serveHostTicket(database, host, { stationOrderId: other.kitchen, from: "received" }),
    ).toEqual({ status: "not_found" });
    const ours = await order(mine.id);
    await sql`update station_orders set status = 'cancelled' where id = ${ours.kitchen}`;
    expect(
      await serveHostTicket(database, host, { stationOrderId: ours.kitchen, from: "received" }),
    ).toEqual({ status: "stale", current: "cancelled" });
    const [count] = await sql<{ n: number }[]>`select count(*)::int as n from station_order_events
      where station_order_id in ${sql([other.kitchen, ours.kitchen])}`;
    expect(count?.n).toBe(0);
  });
});
