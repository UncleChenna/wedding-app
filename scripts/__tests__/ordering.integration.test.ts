import { randomUUID } from "node:crypto";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";

let db: Sql;
const rollback = new Error("rollback ordering fixtures");
async function exercise(run: (tx: TransactionSql) => Promise<void>) {
  try {
    await db.begin(async (tx) => {
      await run(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}
async function fixture(tx: TransactionSql) {
  const table = randomUUID(),
    order = randomUUID(),
    meal = randomUUID(),
    drink = randomUUID();
  const kitchen = randomUUID(),
    bar = randomUUID();
  await tx`insert into tables(id, number, capacity) values (${table}, 900001, 10)`;
  await tx`insert into orders(id, table_id) values (${order}, ${table})`;
  await tx`insert into menu_items(id, name, category_v2, station) values (${meal}, 'Fixture meal', 'meal', 'kitchen'), (${drink}, 'Fixture drink', 'soft_drink', 'bar')`;
  await tx`insert into station_orders(id, order_id, station) values (${kitchen}, ${order}, 'kitchen'), (${bar}, ${order}, 'bar')`;
  return { table, order, meal, drink, kitchen, bar };
}
describe.runIf(process.env.RUN_ORDERING_DB_TESTS === "1")("ordering database constraints", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    db = postgres(url, { max: 1, connect_timeout: 10 });
    await db`select 1`;
  });
  afterAll(async () => {
    if (db) await db.end();
  });
  it("represents a mixed submission once with two station projections", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx);
      await tx`insert into order_items(order_id, station_order_id, menu_item_id, quantity) values (${f.order}, ${f.kitchen}, ${f.meal}, 2), (${f.order}, ${f.bar}, ${f.drink}, 1)`;
      const [row] =
        await tx`select count(distinct o.id)::int as submissions, count(distinct s.id)::int as projections from orders o join station_orders s on s.order_id=o.id where o.table_id=${f.table}`;
      expect(row).toMatchObject({ submissions: 1, projections: 2 });
    });
  });
  it("rejects invalid menu categories and caps", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx);
      await expect(
        tx.savepoint((sp) => sp`update menu_items set category_v2='drink' where id=${f.meal}`),
      ).rejects.toMatchObject({ code: "22P02" });
      for (const cap of [0, 101])
        await expect(
          tx.savepoint((sp) => sp`update menu_items set max_per_order=${cap} where id=${f.meal}`),
        ).rejects.toMatchObject({ code: "23514" });
      await tx`update menu_items set max_per_order=100, is_available=false where id=${f.meal}`;
      const [row] = await tx`select max_per_order, is_available from menu_items where id=${f.meal}`;
      expect(row).toMatchObject({ max_per_order: 100, is_available: false });
    });
  });
  it("rejects nonpositive, excessive and unbounded line quantities", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx);
      for (const [quantity, cap] of [
        [0, 5],
        [-1, 5],
        [6, 5],
        [1, 0],
        [1, 101],
      ]) {
        await expect(
          tx.savepoint(
            (sp) =>
              sp`insert into order_items(order_id,station_order_id,menu_item_id,quantity,quantity_limit) values (${f.order},${f.kitchen},${f.meal},${quantity ?? 0},${cap ?? 0})`,
          ),
        ).rejects.toMatchObject({ code: "23514" });
      }
    });
  });
  it("rejects a child belonging to another submission", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx),
        other = randomUUID();
      await tx`insert into orders(id,table_id) values (${other},${f.table})`;
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into order_items(order_id,station_order_id,menu_item_id) values (${other},${f.kitchen},${f.meal})`,
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });
  it("rejects orphan child and menu links", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx);
      await expect(
        tx.savepoint(
          (sp) => sp`insert into station_orders(order_id,station) values (${randomUUID()},'bar')`,
        ),
      ).rejects.toMatchObject({ code: "23503" });
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into order_items(order_id,station_order_id,menu_item_id) values (${f.order},${f.kitchen},${randomUUID()})`,
        ),
      ).rejects.toMatchObject({ code: "23503" });
    });
  });
  it("rejects repeated idempotency keys without adding a submission", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx),
        key = randomUUID();
      await tx`update orders set client_request_id=${key} where id=${f.order}`;
      await expect(
        tx.savepoint(
          (sp) => sp`insert into orders(table_id,client_request_id) values (${f.table},${key})`,
        ),
      ).rejects.toMatchObject({ code: "23505" });
      const [row] = await tx`select count(*)::int as count from orders where table_id=${f.table}`;
      expect(row?.count).toBe(1);
    });
  });
  it("rejects repeated station projections and duplicate menu lines", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx);
      await expect(
        tx.savepoint(
          (sp) => sp`insert into station_orders(order_id,station) values (${f.order},'kitchen')`,
        ),
      ).rejects.toMatchObject({ code: "23505" });
      await tx`insert into order_items(order_id,station_order_id,menu_item_id) values (${f.order},${f.kitchen},${f.meal})`;
      await expect(
        tx.savepoint(
          (sp) =>
            sp`insert into order_items(order_id,station_order_id,menu_item_id) values (${f.order},${f.kitchen},${f.meal})`,
        ),
      ).rejects.toMatchObject({ code: "23505" });
    });
  });
  it("keeps station states constrained and every ordering table behind RLS", async () => {
    await exercise(async (tx) => {
      const f = await fixture(tx);
      await expect(
        tx.savepoint((sp) => sp`update station_orders set status='ready' where id=${f.kitchen}`),
      ).rejects.toMatchObject({ code: "22P02" });
      const rows =
        await tx`select relname,relrowsecurity from pg_class where oid in ('public.menu_items'::regclass,'public.orders'::regclass,'public.station_orders'::regclass,'public.order_items'::regclass)`;
      expect(rows).toHaveLength(4);
      expect(rows.every((row) => row.relrowsecurity)).toBe(true);
    });
  });
});
