import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";

let db: Sql;
const rollback = new Error("rollback isolated schema");
const files = {
  bootstrap: "drizzle/0000_init.sql",
  expand: "drizzle/0006_ordering-expand.sql",
  backfill: "drizzle/0007_ordering-backfill.sql",
  contract: "drizzle/0008_ordering-contract.sql",
};
async function apply(tx: TransactionSql, schema: string, stage: keyof typeof files) {
  const source = readFileSync(files[stage], "utf8").replaceAll('"public".', `"${schema}".`);
  for (const statement of source.split("--> statement-breakpoint")) {
    if (statement.trim()) await tx.unsafe(statement);
  }
}
async function sandbox(run: (tx: TransactionSql, schema: string) => Promise<void>) {
  const schema = "ordering_test_" + randomUUID().replaceAll("-", "");
  try {
    await db.begin(async (tx) => {
      await tx.unsafe(`create schema "${schema}"`);
      await tx.unsafe(`set local search_path to "${schema}", pg_catalog`);
      await apply(tx, schema, "bootstrap");
      await run(tx, schema);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}
async function fixture(tx: TransactionSql) {
  const table = randomUUID(),
    order = randomUUID(),
    empty = randomUUID();
  const meal = randomUUID(),
    drink = randomUUID(),
    line = randomUUID();
  await tx`insert into tables(id,number,capacity) values (${table},1,10)`;
  await tx`insert into menu_items(id,name,category,station) values (${meal},'Fixture meal','food','kitchen'),(${drink},'Ambiguous fixture drink','drink','bar')`;
  await tx`insert into orders(id,table_id,status,notes,created_at,updated_at) values (${order},${table},'ready','Keep this note','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z'),(${empty},${table},'cancelled',null,'2026-10-01T10:00:00Z','2026-10-01T11:00:00Z')`;
  await tx`insert into order_items(id,order_id,menu_item_id,quantity,notes,created_at) values (${line},${order},${meal},8,'Keep all eight','2026-10-01T10:00:00Z'),(${randomUUID()},${order},${drink},2,null,'2026-10-01T10:00:00Z')`;
  return { table, order, empty, meal, drink, line };
}
async function originalRows(tx: TransactionSql) {
  return {
    menu: await tx`select to_jsonb(m)-'category_v2'-'max_per_order' as row from menu_items m order by id`,
    orders: await tx`select to_jsonb(o)-'client_request_id' as row from orders o order by id`,
    lines:
      await tx`select to_jsonb(i)-'station_order_id'-'quantity_limit' as row from order_items i order by id`,
  };
}
describe.runIf(process.env.RUN_ORDERING_DB_TESTS === "1")("ordering migration preservation", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    // Each rollback-only schema owns fresh enum OIDs; do not reuse prepared result types.
    db = postgres(url, { max: 1, connect_timeout: 10, prepare: false });
  });
  afterAll(async () => {
    if (db) await db.end();
  });
  it("migrates an empty bootstrap without inventing submissions", async () => {
    await sandbox(async (tx, schema) => {
      await apply(tx, schema, "expand");
      await apply(tx, schema, "backfill");
      await apply(tx, schema, "contract");
      const [row] = await tx`select count(*)::int as count from station_orders`;
      expect(row?.count).toBe(0);
    });
  });
  it("preserves every legacy value, mixed orders, empty orders and quantities above five", async () => {
    await sandbox(async (tx, schema) => {
      const f = await fixture(tx);
      const before = await originalRows(tx);
      await apply(tx, schema, "expand");
      // Explicit fixture decision; real drinks require a separately reviewed operator mapping.
      await tx`update menu_items set category_v2='soft_drink' where id=${f.drink}`;
      await apply(tx, schema, "backfill");
      await apply(tx, schema, "contract");
      expect(await originalRows(tx)).toEqual(before);
      const children =
        await tx`select station,status,created_at,updated_at from station_orders where order_id=${f.order} order by station`;
      expect(children).toHaveLength(2);
      expect(
        children.every(
          (row) =>
            row.status === "preparing" &&
            row.created_at.toISOString() === "2026-10-01T10:00:00.000Z" &&
            row.updated_at.toISOString() === "2026-10-01T11:00:00.000Z",
        ),
      ).toBe(true);
      expect(await tx`select id from station_orders where order_id=${f.empty}`).toHaveLength(0);
      const [line] = await tx`select quantity,quantity_limit from order_items where id=${f.line}`;
      expect(line).toMatchObject({ quantity: 8, quantity_limit: 8 });
      const [links] =
        await tx`select count(*)::int as count from order_items i join station_orders s on s.id=i.station_order_id and s.order_id=i.order_id join menu_items m on m.id=i.menu_item_id and m.station=s.station`;
      expect(links?.count).toBe(2);
      expect(await tx`select distinct client_request_id from orders`).toHaveLength(2);
      const [meal] = await tx`select category_v2,max_per_order from menu_items where id=${f.meal}`;
      expect(meal).toMatchObject({ category_v2: "meal", max_per_order: 5 });
    });
  });
  it.each(["unclassified", "duplicate", "quantity"] as const)(
    "rejects %s legacy data without loss or guessing",
    async (kind) => {
      await sandbox(async (tx, schema) => {
        const f = await fixture(tx);
        if (kind === "duplicate")
          await tx`insert into order_items(order_id,menu_item_id,quantity) values (${f.order},${f.meal},1)`;
        if (kind === "quantity") await tx`update order_items set quantity=101 where id=${f.line}`;
        await apply(tx, schema, "expand");
        if (kind !== "unclassified")
          await tx`update menu_items set category_v2='alcohol' where id=${f.drink}`;
        const before = await originalRows(tx);
        const message =
          kind === "unclassified"
            ? /classify every legacy drink/
            : kind === "duplicate"
              ? /duplicate legacy/
              : /quantity outside/;
        await expect(tx.savepoint((sp) => apply(sp, schema, "backfill"))).rejects.toThrow(message);
        expect(await originalRows(tx)).toEqual(before);
        expect(await tx`select id from station_orders`).toHaveLength(0);
        const [meal] = await tx`select category_v2 from menu_items where id=${f.meal}`;
        expect(meal?.category_v2).toBeNull();
      });
    },
  );
  it("retains the existing positive-quantity constraint throughout expansion", async () => {
    await sandbox(async (tx, schema) => {
      const f = await fixture(tx);
      await apply(tx, schema, "expand");
      await expect(
        tx.savepoint((sp) => sp`update order_items set quantity=0 where id=${f.line}`),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });
});
