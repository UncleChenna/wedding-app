import { randomInt, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { drainWhatsAppAlerts } from "../../src/modules/ordering/server/whatsapp-drain";

const config = {
  accessToken: "synthetic-only",
  phoneNumberId: "1234",
  apiVersion: "v27.0",
  template: "order_alert",
  language: "en_GB",
};
describe.runIf(process.env.RUN_WHATSAPP_DB_TESTS === "1")("WhatsApp durable claims", () => {
  let sql: Sql;
  let database: Db;
  const tableId = randomUUID();
  const staffIds = [randomUUID(), randomUUID()];
  const numbers = ["+2348031234567", "+2348031234567"];
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    sql = postgres(process.env.DATABASE_URL ?? "", { max: 4 });
    database = drizzle(sql, { schema });
    await sql`insert into tables(id,number,capacity) values (${tableId},${randomInt(100000, 900000)},8)`;
    for (const [index, id] of staffIds.entries())
      await sql`insert into staff(id,name,role,whatsapp_number,alerts_opt_in) values (${id},'TICKET-085 synthetic','kitchen',${numbers[index] ?? ""},true)`;
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      await sql`delete from orders where table_id=${tableId}`;
      await sql`delete from tables where id=${tableId}`;
      await sql`delete from staff where id in ${sql(staffIds)}`;
    } finally {
      await sql.end();
    }
  });
  async function enqueue(text = "Table 1: rice.") {
    const orderId = randomUUID(),
      stationOrderId = randomUUID(),
      alertId = randomUUID();
    await sql`insert into orders(id,table_id) values (${orderId},${tableId})`;
    await sql`insert into station_orders(id,order_id,station) values (${stationOrderId},${orderId},'kitchen')`;
    await sql`insert into order_alerts(id,station_order_id,station,message,created_at) values (${alertId},${stationOrderId},'kitchen',${text},now()-interval '2 minutes')`;
    return alertId;
  }
  it("commits the claim before HTTP, deduplicates a shared phone and prevents concurrent/repeated sends", async () => {
    const id = await enqueue();
    const fetcher = vi.fn(async () => {
      const [row] = await sql`select status from order_alerts where id=${id}`;
      expect(row?.status).toBe("failed"); // visible from a separate connection before HTTP resolves
      return Response.json({ messages: [{ id: "wamid.synthetic" }] });
    });
    vi.stubGlobal("fetch", fetcher);
    await Promise.all([
      drainWhatsAppAlerts(database, config),
      drainWhatsAppAlerts(database, config),
    ]);
    await drainWhatsAppAlerts(database, config);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [row] = await sql`select status,attempts from order_alerts where id=${id}`;
    expect(row).toMatchObject({ status: "sent", attempts: 1 });
    vi.unstubAllGlobals();
  });
  it("does not replay timeout-after-acceptance and leaves orders operational", async () => {
    const id = await enqueue();
    const fetcher = vi.fn(async () => {
      throw new Error("synthetic timeout after acceptance");
    });
    vi.stubGlobal("fetch", fetcher);
    expect(await drainWhatsAppAlerts(database, config)).toEqual({ sent: 0, failed: 1 });
    await drainWhatsAppAlerts(database, config);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [row] =
      await sql`select a.status,s.status as order_status from order_alerts a join station_orders s on s.id=a.station_order_id where a.id=${id}`;
    expect(row).toMatchObject({ status: "failed", order_status: "received" });
    vi.unstubAllGlobals();
  });
  it("leaves later bounded batches pending and never truncates instructions", async () => {
    const first = await enqueue("a".repeat(800));
    const second = await enqueue("b".repeat(800));
    const fetcher = vi.fn(async () => Response.json({ messages: [{ id: "wamid.synthetic" }] }));
    vi.stubGlobal("fetch", fetcher);
    await drainWhatsAppAlerts(database, config);
    const rows =
      await sql`select status from order_alerts where id in (${first},${second}) order by status::text`;
    expect(rows.map((row) => row.status)).toEqual(["pending", "sent"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await drainWhatsAppAlerts(database, config);
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
  it("records an oversized whole-order instruction as failed without truncating or sending", async () => {
    const id = await enqueue("x".repeat(1025));
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(await drainWhatsAppAlerts(database, config)).toEqual({ sent: 0, failed: 1 });
    expect(fetcher).not.toHaveBeenCalled();
    const [row] = await sql`select status,message from order_alerts where id=${id}`;
    expect(row?.status).toBe("failed");
    expect(String(row?.message).length).toBe(1025);
    vi.unstubAllGlobals();
  });
  it("preserves pending rows while every recipient is opted out", async () => {
    await sql`update staff set alerts_opt_in=false where id in ${sql(staffIds)}`;
    const id = await enqueue();
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await drainWhatsAppAlerts(database, config);
    expect(fetcher).not.toHaveBeenCalled();
    const [row] = await sql`select status,attempts from order_alerts where id=${id}`;
    expect(row).toMatchObject({ status: "pending", attempts: 0 });
    vi.unstubAllGlobals();
  });
});
