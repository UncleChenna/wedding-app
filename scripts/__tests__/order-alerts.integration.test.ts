import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import { setOrderingOpen } from "../../e2e/support/ordering-open";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { createOrder as CreateOrder } from "../../src/modules/ordering/server/create-order";
import type { drainOrderAlerts as DrainOrderAlerts } from "../../src/modules/ordering/server/alert-outbox";
import type { AlertSender } from "../../src/modules/ordering/server/alert-drain";
import type { Station } from "../../src/modules/ordering/lib/stations";

/**
 * ADR 0022 against Postgres. The drain sees every pending alert in this local database, so
 * assertions only look at lines for this run's tables.
 */
describe.runIf(process.env.RUN_ORDER_ALERT_DB_TESTS === "1")("order alert outbox", () => {
  let sql: Sql;
  let database: Db;
  let createOrder: typeof CreateOrder;
  let drain: typeof DrainOrderAlerts;
  let restoreOrdering: (() => Promise<void>) | undefined;
  const tag = "TICKET-084 fixture " + randomInt(100000, 900000);
  const meal = randomUUID();
  const drink = randomUUID();
  const tableIds: string[] = [];

  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 8, connect_timeout: 10 });
    restoreOrdering = await setOrderingOpen(sql, true);
    database = drizzle(sql, { schema }) as unknown as Db;
    createOrder = (await import("../../src/modules/ordering/server/create-order")).createOrder;
    drain = (await import("../../src/modules/ordering/server/alert-outbox")).drainOrderAlerts;
    await sql`insert into menu_items(id, name, category_v2, station, max_per_order, is_available) values
      (${meal}, 'jollof', 'meal', 'kitchen', 3, true),
      (${drink}, 'water', 'soft_drink', 'bar', 3, true)`;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      if (tableIds.length) {
        await sql`delete from orders where table_id in ${sql(tableIds)}`;
        await sql`delete from tables where id in ${sql(tableIds)}`;
      }
      await sql`delete from menu_items where id in ${sql([meal, drink])}`;
    } finally {
      await restoreOrdering?.();
      await sql.end();
    }
  });

  async function newTable() {
    const number = randomInt(100000, 900000);
    const [row] = await sql<
      { id: string }[]
    >`insert into tables(number, name, capacity) values (${number}, ${tag}, 8) returning id`;
    if (row) tableIds.push(row.id);
    return number;
  }
  async function order(table: number, note = "") {
    const result = await createOrder(database, {
      clientRequestId: randomUUID(),
      table,
      items: [
        { menuItemId: meal, quantity: 2 },
        { menuItemId: drink, quantity: 1 },
      ],
      note,
    });
    expect(result).toMatchObject({ status: "created" });
    return result.status === "created" ? result.orderId : "";
  }
  const alertsFor = (orderId: string) =>
    sql<
      { station: string; message: string; status: string; attempts: number }[]
    >`select a.station, a.message, a.status, a.attempts from order_alerts a
      join station_orders s on s.id = a.station_order_id where s.order_id = ${orderId}
      order by a.station::text`;
  function recorder(fail = false) {
    const sent: { station: Station; text: string }[] = [];
    const send: AlertSender = async (message) => {
      if (fail) throw new Error("provider down");
      sent.push(message);
    };
    const linesFor = (tables: number[]) =>
      sent
        .map((m) => ({
          station: m.station,
          lines: m.text
            .split("\n")
            .filter((line) => tables.some((t) => line.startsWith(`Table ${t}:`))),
        }))
        .filter((m) => m.lines.length);
    return { send, sent, linesFor };
  }
  const later = (seconds: number) => new Date(Date.now() + seconds * 1000);

  it("queues one formatted alert per station ticket with the order", async () => {
    const table = await newTable();
    const id = await order(table, "no pepper");
    expect(await alertsFor(id)).toEqual([
      {
        station: "bar",
        message: `Table ${table}: 1 x water. Note: no pepper.`,
        status: "pending",
        attempts: 0,
      },
      {
        station: "kitchen",
        message: `Table ${table}: 2 x jollof. Note: no pepper.`,
        status: "pending",
        attempts: 0,
      },
    ]);
  });

  it("batches three orders in a minute into one message per station", async () => {
    const tables = [await newTable(), await newTable(), await newTable()];
    for (const table of tables) await order(table);
    const early = recorder();
    await drain(database, early.send, new Date());
    expect(early.linesFor(tables)).toEqual([]);

    const due = recorder();
    await drain(database, due.send, later(51));
    const batches = due.linesFor(tables);
    expect(batches.map((b) => b.station).sort()).toEqual(["bar", "kitchen"]);
    for (const batch of batches) expect(batch.lines).toHaveLength(3);
  });

  it("sends the last pending batch on the schedule with no further orders, exactly once", async () => {
    const table = await newTable();
    const id = await order(table);
    // Traffic stops. The next scheduled ticks still send it, and a later tick never repeats it.
    const first = recorder();
    await drain(database, first.send, later(60));
    expect(first.linesFor([table])).toHaveLength(2);
    const again = recorder();
    await drain(database, again.send, later(70));
    expect(again.linesFor([table])).toEqual([]);
    expect((await alertsFor(id)).map((a) => a.status)).toEqual(["sent", "sent"]);
  });

  it("never sends an alert twice when two drains overlap", async () => {
    const table = await newTable();
    await order(table);
    const sent: string[] = [];
    const slow: AlertSender = async ({ text }) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      sent.push(...text.split("\n").filter((line) => line.startsWith(`Table ${table}:`)));
    };
    await Promise.all([drain(database, slow, later(60)), drain(database, slow, later(60))]);
    expect(sent).toHaveLength(2);
  });

  it("keeps orders and retries when sending fails, then gives up after five attempts", async () => {
    const table = await newTable();
    const id = await order(table);
    const down = recorder(true);
    const result = await drain(database, down.send, later(60));
    expect(result.failed).toBeGreaterThanOrEqual(2);
    expect(await alertsFor(id)).toMatchObject([
      { status: "pending", attempts: 1 },
      { status: "pending", attempts: 1 },
    ]);
    // A failed alert never touches the order, and the next order still goes through.
    expect((await sql`select 1 from orders where id = ${id}`).length).toBe(1);
    await order(await newTable());
    for (let tick = 0; tick < 4; tick++) await drain(database, down.send, later(70 + tick * 10));
    expect(await alertsFor(id)).toMatchObject([
      { status: "failed", attempts: 5 },
      { status: "failed", attempts: 5 },
    ]);
  });
});
