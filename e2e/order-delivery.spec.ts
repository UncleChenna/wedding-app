import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { setOrderingOpen } from "./support/ordering-open";

// Explicit emulation, not physical venue certification. Current CDP documents
// latency as minimum request→response-header delay and throughput in bytes/sec:
// https://chromedevtools.github.io/devtools-protocol/tot/Network/
const slow4g = { latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 };
async function throttle(context: BrowserContext, page: Page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditionsByRule", {
    offline: false,
    matchedNetworkConditions: [{ urlPattern: "", ...slow4g }],
  });
  await cdp.send("Network.overrideNetworkState", {
    offline: false,
    ...slow4g,
    connectionType: "cellular4g",
  });
}

const staffId = randomUUID();
const tableId = randomUUID();
const menuId = randomUUID();
const number = randomInt(1_000_000, 2_000_000);
const pin = String(randomInt(100000, 999999));
const name = `Delivery fixture ${menuId.slice(0, 8)}`;
let db: Sql;
let restoreOrdering: (() => Promise<void>) | undefined;
let restoreEvent: (() => Promise<unknown>) | undefined;

test.describe("real slow-4G guest-to-board delivery", () => {
  test.skip(
    process.env.RUN_ORDER_DELIVERY_E2E !== "1",
    "Requires the owned Supabase Realtime stack",
  );
  test.beforeAll(async () => {
    if (!process.env.DATABASE_URL && existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    // A native PostgreSQL stand-in cannot certify actual Realtime transport.
    const [realtime] = await db<{ present: boolean }[]>`
      select to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null as present`;
    if (!realtime?.present) throw new Error("Actual Supabase Realtime is required");
    const [previous] = await db<{ date: string | null; zone: string | null }[]>`
      select event_date::text as date,time_zone as zone from event_settings where id=1`;
    await db`insert into event_settings(id,event_date,time_zone)
      values(1,(now()+interval '7 days')::date,'Africa/Lagos') on conflict(id)
      do update set event_date=excluded.event_date,time_zone=excluded.time_zone`;
    restoreEvent = () =>
      previous
        ? db`update event_settings set event_date=${previous.date},time_zone=${previous.zone} where id=1`
        : db`delete from event_settings where id=1`;
    restoreOrdering = await setOrderingOpen(db, true);
    const salt = randomBytes(32);
    const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    const credential = `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at)
      values(${staffId},${name},'kitchen',${credential},now()-interval '1 minute',now()+interval '1 day')`;
    await db`insert into tables(id,number,name,capacity) values(${tableId},${number},${name},8)`;
    await db`insert into menu_items(id,name,category_v2,station,max_per_order,is_available)
      values(${menuId},${name},'meal','kitchen',5,true)`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from orders where table_id=${tableId}`;
      await db`delete from menu_items where id=${menuId}`;
      await db`delete from tables where id=${tableId}`;
      await db`delete from staff_pin_attempts where device_id in
        (select id from registered_devices where registered_by_staff_id=${staffId})`;
      await db`delete from registered_devices where registered_by_staff_id=${staffId}`;
      await db`delete from staff where id=${staffId}`;
      await restoreOrdering?.();
      await restoreEvent?.();
    } finally {
      await db.end();
    }
  });
  test("a real submitted order reaches the authenticated kitchen in under two seconds", async ({
    browser,
    browserName,
    baseURL,
  }, info) => {
    test.skip(browserName !== "chromium", "Explicit Chromium CDP network emulation");
    test.setTimeout(120_000);
    if (!baseURL) throw new Error("Production base URL required");
    const guest = await browser.newContext({ baseURL, viewport: { width: 375, height: 812 } });
    const staff = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } });
    try {
      const guestPage = await guest.newPage();
      const boardPage = await staff.newPage();
      const broadcastFrames: { payload: string; receivedAt: number }[] = [];
      boardPage.on("websocket", (socket) => {
        socket.on("framereceived", ({ payload }) => {
          // Supabase supports both text and binary broadcast framing; the
          // event/JSON payload is UTF-8 in either representation.
          const text = typeof payload === "string" ? payload : payload.toString("utf8");
          if (text.includes("order.changed")) {
            broadcastFrames.push({ payload: text, receivedAt: performance.now() });
          }
        });
      });
      await throttle(guest, guestPage);
      await throttle(staff, boardPage);
      await boardPage.goto("/kitchen");
      await boardPage.getByLabel("Your six-digit PIN").fill(pin);
      await boardPage.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(boardPage.getByRole("button", { name: "Sign out" })).toBeVisible();
      await expect(boardPage.getByRole("status").filter({ hasText: "Live" })).toBeVisible({
        timeout: 15_000,
      });
      await guest.addCookies([{ name: "wedding-table", value: String(number), url: baseURL }]);
      await guestPage.goto("/order");
      await guestPage.getByRole("button", { name: `Increase ${name} quantity` }).click();
      const received = boardPage.getByRole("listitem").filter({ hasText: `Table ${number}` });
      await expect(received).toHaveCount(0);
      const started = performance.now();
      await guestPage.getByRole("button", { name: "Send order", exact: true }).click();
      await expect(received).toBeVisible({ timeout: 2_000 });
      const elapsedMs = performance.now() - started;
      await info.attach("slow-4g-delivery.json", {
        body: JSON.stringify(
          {
            elapsedMs,
            limitMs: 2000,
            profile: slow4g,
            transport: "real authenticated Supabase Realtime; both browser contexts throttled",
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      expect(elapsedMs).toBeLessThan(2_000);
      await expect(received).toContainText(name);
      await expect(received).toContainText("1 ×");
      const rows = await db<{ orderId: string; quantity: number; station: string }[]>`
        select o.id as "orderId",oi.quantity,so.station from orders o join station_orders so on so.order_id=o.id
        join order_items oi on oi.station_order_id=so.id
        where o.table_id=${tableId} and oi.menu_item_id=${menuId}`;
      expect(rows).toEqual([{ orderId: expect.any(String), quantity: 1, station: "kitchen" }]);
      const order = rows[0];
      if (!order) throw new Error("Submitted order missing");
      expect(
        broadcastFrames.some(
          (frame) =>
            frame.payload.includes(order.orderId) && frame.receivedAt <= started + elapsedMs,
        ),
      ).toBe(true);
      mkdirSync("docs/reviews/TICKET-081", { recursive: true });
      writeFileSync(
        "docs/reviews/TICKET-081/delivery.json",
        JSON.stringify(
          {
            elapsedMs,
            limitMs: 2000,
            profile: slow4g,
            matchingBroadcastBeforeVisible: true,
            persistedQuantity: 1,
          },
          null,
          2,
        ) + "\n",
      );
    } finally {
      await guest.close();
      await staff.close();
    }
  });
});
