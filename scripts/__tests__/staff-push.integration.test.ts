import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type { drainStaffPush as DrainStaffPush } from "../../src/modules/ordering/server/staff-push-outbox";
import type { createOrder as CreateOrder } from "../../src/modules/ordering/server/create-order";

describe.runIf(process.env.RUN_STAFF_PUSH_DB_TESTS === "1")("staff push durable delivery", () => {
  let sql: Sql;
  let database: Db;
  let drainStaffPush: typeof DrainStaffPush;
  let createOrder: typeof CreateOrder;
  const staffId = randomUUID(),
    device = randomUUID(),
    meal = randomUUID();
  const tableIds: string[] = [];
  let original:
    { event_date: string; time_zone: string | null; ordering_open: boolean } | undefined;
  const endpoint = "https://fcm.googleapis.com/fcm/send/" + randomUUID();
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 4 });
    database = drizzle(sql, { schema }) as unknown as Db;
    drainStaffPush = (await import("../../src/modules/ordering/server/staff-push-outbox"))
      .drainStaffPush;
    createOrder = (await import("../../src/modules/ordering/server/create-order")).createOrder;
    [original] =
      await sql`select event_date::text, time_zone, ordering_open from event_settings where id=1`;
    await sql`insert into event_settings(id,event_date,time_zone,ordering_open) values(1,'2099-12-19','UTC',true)
      on conflict(id) do update set event_date='2099-12-19',time_zone='UTC',ordering_open=true`;
    const pinHash = `scrypt$16384$8$1$${"ab".repeat(16)}$${"cd".repeat(64)}`;
    await sql`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at)
      values(${staffId},'Synthetic push operator','kitchen',${pinHash},now()-interval '1 day','2099-12-20')`;
    await sql`insert into registered_devices(id,name,role,registered_by_staff_id) values(${device},'Synthetic push device','kitchen',${staffId})`;
    await sql`insert into staff_push_subscriptions(device_id,staff_id,station,credential_version,endpoint,p256dh,auth,expires_at,created_at)
      values(${device},${staffId},'kitchen',1,${endpoint},${`B${"A".repeat(86)}`},${"A".repeat(22)},'2099-12-20',now()-interval '1 hour')`;
    await sql`insert into menu_items(id,name,category_v2,station,max_per_order,is_available) values(${meal},'Synthetic meal','meal','kitchen',3,true)`;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      if (tableIds.length) {
        await sql`delete from orders where table_id in ${sql(tableIds)}`;
        await sql`delete from tables where id in ${sql(tableIds)}`;
      }
      await sql`delete from menu_items where id=${meal}`;
      await sql`delete from registered_devices where id=${device}`;
      await sql`delete from staff where id=${staffId}`;
      if (original)
        await sql`update event_settings set event_date=${original.event_date},time_zone=${original.time_zone},ordering_open=${original.ordering_open} where id=1`;
      else await sql`delete from event_settings where id=1`;
    } finally {
      await sql.end();
    }
  });
  async function order() {
    const number = randomInt(100000, 900000);
    const [row] =
      await sql`insert into tables(number,name,capacity) values(${number},'Synthetic push table',8) returning id`;
    if (!row) throw new Error("fixture table missing");
    tableIds.push(row.id as string);
    const result = await createOrder(database, {
      clientRequestId: randomUUID(),
      table: number,
      items: [{ menuItemId: meal, quantity: 1 }],
      note: "private dietary note",
    });
    if (result.status !== "created") throw new Error("fixture order failed: " + result.status);
    return result.orderId;
  }
  const state = async (id: string) =>
    (
      await sql`select a.push_status,a.push_attempts,a.status from order_alerts a join station_orders s on s.id=a.station_order_id where s.order_id=${id}`
    )[0];
  it("coalesces committed orders and leaves the original delivery channel untouched", async () => {
    const ids = [await order(), await order(), await order()];
    const send = vi.fn(async () => "sent" as const);
    await drainStaffPush(database, send);
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ endpoint }), "kitchen");
    expect(JSON.stringify(send.mock.calls)).not.toContain("private dietary note");
    for (const id of ids)
      expect(await state(id)).toMatchObject({ push_status: "sent", status: "pending" });
    await drainStaffPush(database, send);
    expect(send).toHaveBeenCalledOnce();
  });
  it("retries failed pushes without changing committed orders, then stops after five attempts", async () => {
    const id = await order();
    const send = vi.fn(async () => "failed" as const);
    for (let i = 0; i < 5; i++) await drainStaffPush(database, send);
    expect(await state(id)).toMatchObject({
      push_status: "failed",
      push_attempts: 5,
      status: "pending",
    });
    expect(await sql`select id from orders where id=${id}`).toHaveLength(1);
  });
  it("does not deliver after credential rotation or device revocation", async () => {
    await sql`update staff set credential_version=2 where id=${staffId}`;
    await order();
    const send = vi.fn(async () => "sent" as const);
    await drainStaffPush(database, send);
    await sql`update staff set credential_version=1 where id=${staffId}`;
    await sql`update registered_devices set revoked_at=now() where id=${device}`;
    await order();
    await drainStaffPush(database, send);
    expect(send).not.toHaveBeenCalled();
    await sql`update registered_devices set revoked_at=null where id=${device}`;
  });
  it("retires a subscription rejected by its push service", async () => {
    await order();
    await drainStaffPush(database, async () => "expired");
    expect(
      await sql`select device_id from staff_push_subscriptions where device_id=${device}`,
    ).toHaveLength(0);
  });
});
