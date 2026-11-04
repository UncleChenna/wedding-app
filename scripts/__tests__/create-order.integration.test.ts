import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { createOrder as CreateOrder } from "../../src/modules/ordering/server/create-order";
import type { OrderRejection, OrderSubmission } from "../../src/modules/ordering/lib/order";

let sql: Sql;
let database: Db;
let createOrder: typeof CreateOrder;
const tag = "TICKET-072 fixture " + randomInt(100000, 900000);
/** Each test orders at its own table, so one test's orders never trip another's limits. */
let table = 0;
const tableIds: string[] = [];
const menuIds: Record<"meal" | "drink" | "soldOut", string> = {
  meal: randomUUID(),
  drink: randomUUID(),
  soldOut: randomUUID(),
};

function submission(overrides: Partial<OrderSubmission> = {}): OrderSubmission {
  return {
    clientRequestId: randomUUID(),
    table,
    items: [
      { menuItemId: menuIds.meal, quantity: 2 },
      { menuItemId: menuIds.drink, quantity: 1 },
    ],
    note: "No pepper",
    ...overrides,
  };
}
async function ordersFor(clientRequestId: string) {
  return sql<
    { id: string; notes: string | null }[]
  >`select id, notes from orders where client_request_id = ${clientRequestId}`;
}

describe.runIf(process.env.RUN_ORDER_SUBMIT_DB_TESTS === "1")("guest order submission", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 8, connect_timeout: 10 });
    database = drizzle(sql, { schema }) as unknown as Db;
    createOrder = (await import("../../src/modules/ordering/server/create-order")).createOrder;
    await sql`insert into menu_items(id, name, category_v2, station, max_per_order, is_available) values
      (${menuIds.meal}, ${tag + " meal"}, 'meal', 'kitchen', 3, true),
      (${menuIds.drink}, ${tag + " drink"}, 'soft_drink', 'bar', 2, true),
      (${menuIds.soldOut}, ${tag + " sold out"}, 'meal', 'kitchen', 3, false)`;
  });
  beforeEach(async () => {
    table = randomInt(100000, 900000);
    const [row] = await sql<
      { id: string }[]
    >`insert into tables(number, name, capacity) values (${table}, ${tag}, 8) returning id`;
    if (row) tableIds.push(row.id);
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      await sql`delete from orders where table_id in ${sql(tableIds)}`;
      await sql`delete from menu_items where id in ${sql(Object.values(menuIds))}`;
      await sql`delete from tables where id in ${sql(tableIds)}`;
    } finally {
      await sql.end();
    }
  });

  it("creates one submission split by station with quantity limits snapshotted", async () => {
    const order = submission();
    const result = await createOrder(database, order);
    expect(result.status).toBe("created");
    const [stored] = await ordersFor(order.clientRequestId);
    expect(stored?.notes).toBe("No pepper");
    const stations = await sql<
      { station: string; items: number }[]
    >`select s.station, count(i.id)::int as items from station_orders s join order_items i on i.station_order_id = s.id where s.order_id = ${stored?.id ?? ""} group by s.station order by s.station::text`;
    expect(stations).toEqual([
      { station: "bar", items: 1 },
      { station: "kitchen", items: 1 },
    ]);
    const items = await sql<
      { menu_item_id: string; quantity: number; quantity_limit: number }[]
    >`select menu_item_id, quantity, quantity_limit from order_items where order_id = ${stored?.id ?? ""} order by quantity desc`;
    expect(items).toEqual([
      { menu_item_id: menuIds.meal, quantity: 2, quantity_limit: 3 },
      { menu_item_id: menuIds.drink, quantity: 1, quantity_limit: 2 },
    ]);
  });

  it.each([
    ["kitchen", "meal"],
    ["bar", "drink"],
  ] as const)("keeps a %s-only submission as one station ticket", async (station, key) => {
    const order = submission({ items: [{ menuItemId: menuIds[key], quantity: 1 }] });
    const result = await createOrder(database, order);
    expect(result.status).toBe("created");
    const tickets = await sql<
      { station: string; order_id: string }[]
    >`select s.station, s.order_id from station_orders s join orders o on o.id = s.order_id where o.client_request_id = ${order.clientRequestId}`;
    expect(tickets).toEqual([
      { station, order_id: result.status === "created" ? result.orderId : "" },
    ]);
  });

  it("gives both station tickets of a mixed submission the same submission id", async () => {
    const order = submission();
    const result = await createOrder(database, order);
    const tickets = await sql<
      { station: string; order_id: string }[]
    >`select s.station, s.order_id from station_orders s join orders o on o.id = s.order_id where o.client_request_id = ${order.clientRequestId} order by s.station::text`;
    const orderId = result.status === "created" ? result.orderId : "";
    expect(tickets).toEqual([
      { station: "bar", order_id: orderId },
      { station: "kitchen", order_id: orderId },
    ]);
  });

  it("answers an identical replay with the same order and refuses a changed one", async () => {
    const order = submission();
    const first = await createOrder(database, order);
    const reordered = { ...order, items: [...order.items].reverse() };
    const replay = await createOrder(database, reordered);
    expect(first.status).toBe("created");
    expect(replay).toEqual({
      status: "replayed",
      orderId: first.status === "created" ? first.orderId : "",
    });
    expect(
      await createOrder(database, {
        ...order,
        items: [{ menuItemId: menuIds.meal, quantity: 1 }],
      }),
    ).toEqual({ status: "rejected", reason: "mismatch" });
    expect(await createOrder(database, { ...order, note: "Different" })).toEqual({
      status: "rejected",
      reason: "mismatch",
    });
    expect(await ordersFor(order.clientRequestId)).toHaveLength(1);
  });

  it("turns duplicate taps racing in parallel into one order", async () => {
    const order = submission();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => createOrder(database, order)),
    );
    const ids = new Set(results.map((result) => ("orderId" in result ? result.orderId : null)));
    expect(ids.size).toBe(1);
    expect(results.filter((result) => result.status === "created")).toHaveLength(1);
    expect(results.filter((result) => result.status === "replayed")).toHaveLength(5);
    expect(await ordersFor(order.clientRequestId)).toHaveLength(1);
  });

  const rejections: [OrderRejection, Partial<OrderSubmission>, string[] | undefined][] = [
    ["sold-out", { items: [{ menuItemId: menuIds.soldOut, quantity: 1 }] }, [menuIds.soldOut]],
    ["over-limit", { items: [{ menuItemId: menuIds.drink, quantity: 3 }] }, [menuIds.drink]],
    ["table-missing", { table: 2_000_000 }, undefined],
    ["invalid", { items: [{ menuItemId: randomUUID(), quantity: 1 }] }, undefined],
  ];
  it.each(rejections)("rejects %s without writing anything", async (reason, overrides, itemIds) => {
    const order = submission(overrides);
    const result = await createOrder(database, order);
    expect(result).toEqual(
      itemIds ? { status: "rejected", reason, itemIds } : { status: "rejected", reason },
    );
    expect(await ordersFor(order.clientRequestId)).toHaveLength(0);
  });

  it("waits for a concurrent sold-out change and then refuses the item", async () => {
    const held = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const admin = sql.begin(async (tx) => {
      await tx`update menu_items set is_available = false where id = ${menuIds.meal}`;
      held.resolve();
      await release.promise;
    });
    try {
      await held.promise;
      const order = submission();
      const pending = createOrder(database, order);
      await new Promise((resolve) => setTimeout(resolve, 100));
      release.resolve();
      await admin;
      expect(await pending).toEqual({
        status: "rejected",
        reason: "sold-out",
        itemIds: [menuIds.meal],
      });
      expect(await ordersFor(order.clientRequestId)).toHaveLength(0);
    } finally {
      release.resolve();
      await admin;
      await sql`update menu_items set is_available = true where id = ${menuIds.meal}`;
    }
  });

  it("rolls the whole submission back when a later write fails", async () => {
    const failing: Pick<Db, "transaction"> = {
      transaction: ((run: Parameters<Db["transaction"]>[0]) =>
        database.transaction((tx) =>
          run(
            new Proxy(tx, {
              get(target, property, receiver) {
                if (property !== "insert") return Reflect.get(target, property, receiver);
                return (table: unknown) => {
                  if (table === schema.orderItems) throw new Error("simulated failure");
                  return target.insert(table as typeof schema.orders);
                };
              },
            }),
          ),
        )) as Db["transaction"],
    };
    const order = submission();
    await expect(createOrder(failing, order)).rejects.toThrow("simulated failure");
    expect(await ordersFor(order.clientRequestId)).toHaveLength(0);
    expect(
      await sql`select 1 from station_orders s join orders o on o.id = s.order_id where o.client_request_id = ${order.clientRequestId}`,
    ).toHaveLength(0);
  });

  describe("table limits (TICKET-073)", () => {
    const tableId = () => tableIds.at(-1) ?? "";
    /** Earlier orders for this test's table, placed long enough ago to be past any cooldown. */
    async function earlier(statuses: string[], minutesAgo = 10) {
      for (const status of statuses)
        await sql`insert into orders(table_id, status, created_at) values (${tableId()}, ${status}, now() - make_interval(mins => ${minutesAgo}))`;
    }
    const tableOrders = async () =>
      (
        await sql<
          { n: number }[]
        >`select count(*)::int as n from orders where table_id = ${tableId()}`
      )[0]?.n;
    /** Runs with changed event settings inside a transaction that is always rolled back. */
    async function withSettings(
      values: Partial<typeof schema.eventSettings.$inferInsert>,
      run: (tx: Pick<Db, "transaction">) => Promise<void>,
    ) {
      const rollback = new Error("rollback settings");
      await database
        .transaction(async (tx) => {
          await tx
            .insert(schema.eventSettings)
            .values({ id: 1, ...values })
            .onConflictDoUpdate({ target: schema.eventSettings.id, set: values });
          await run(tx as unknown as Pick<Db, "transaction">);
          throw rollback;
        })
        .catch((error: unknown) => {
          if (error !== rollback) throw error;
        });
    }

    it("refuses the 4th open order with the default limit of 3", async () => {
      await earlier(["received", "preparing", "ready"]);
      const order = submission();
      expect(await createOrder(database, order)).toEqual({
        status: "rejected",
        reason: "too-many-open",
      });
      expect(await ordersFor(order.clientRequestId)).toHaveLength(0);
    });

    it("frees a slot once an order is served or cancelled", async () => {
      await earlier(["received", "preparing", "served", "cancelled"]);
      expect((await createOrder(database, submission())).status).toBe("created");
    });

    it("refuses a second order within a 60-second cooldown and states the seconds left", async () => {
      await withSettings({ orderCooldownSeconds: 60 }, async (tx) => {
        expect((await createOrder(tx, submission())).status).toBe("created");
        const second = await createOrder(tx, submission());
        expect(second).toMatchObject({ status: "rejected", reason: "cooldown" });
        const seconds = second.status === "rejected" ? (second.retryAfterSeconds ?? 0) : 0;
        expect(seconds).toBeGreaterThanOrEqual(55);
        expect(seconds).toBeLessThanOrEqual(60);
      });
    });

    it("counts a mixed kitchen and bar submission once", async () => {
      await earlier(["received", "received"]);
      const mixed = submission();
      expect((await createOrder(database, mixed)).status).toBe("created");
      expect(await tableOrders()).toBe(3);
      // Past the cooldown, the table is now at its limit of 3 submissions, not 4 station tickets.
      await sql`update orders set created_at = now() - interval '10 minutes' where table_id = ${tableId()}`;
      expect(await createOrder(database, submission())).toEqual({
        status: "rejected",
        reason: "too-many-open",
      });
    });

    it("lets parallel submissions from one table through only once", async () => {
      await earlier(["received", "received"]);
      const results = await Promise.all(
        Array.from({ length: 8 }, () => createOrder(database, submission())),
      );
      expect(results.filter((result) => result.status === "created")).toHaveLength(1);
      expect(
        results.filter((result) => result.status === "rejected" && result.reason === "cooldown"),
      ).toHaveLength(7);
      expect(await tableOrders()).toBe(3);
    });

    it("caps every item at the event-wide quantity limit too", async () => {
      await withSettings({ maxItemQuantity: 1 }, async (tx) => {
        expect(
          await createOrder(tx, submission({ items: [{ menuItemId: menuIds.meal, quantity: 2 }] })),
        ).toEqual({ status: "rejected", reason: "over-limit", itemIds: [menuIds.meal] });
      });
    });
  });
});
