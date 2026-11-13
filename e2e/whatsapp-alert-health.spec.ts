import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

// Synthetic database evidence only. This test never invokes /api/alerts/drain or Meta.
test.describe("staff WhatsApp health", () => {
  test.skip(process.env.RUN_WHATSAPP_BOARD_E2E !== "1", "Needs isolated staff fixtures");
  test.describe.configure({ mode: "serial" });
  let db: Sql;
  let restore: () => Promise<unknown>;
  const staffId = randomUUID(),
    tableId = randomUUID(),
    orderId = randomUUID(),
    ticketId = randomUUID(),
    menuId = randomUUID();
  const pin = String(randomInt(100000, 999999));
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [settings] =
      await db`select event_date::text as date,time_zone as zone from event_settings where id=1`;
    await db`insert into event_settings(id,event_date,time_zone) values(1,(now()+interval '7 days')::date,'Africa/Lagos') on conflict(id) do update set event_date=excluded.event_date,time_zone=excluded.time_zone`;
    restore = () =>
      settings
        ? db`update event_settings set event_date=${settings.date},time_zone=${settings.zone} where id=1`
        : db`delete from event_settings where id=1`;
    const salt = randomBytes(32),
      hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    const credential = `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staffId},'TICKET-085 synthetic','kitchen',${credential},now()-interval '1 minute',now()+interval '1 day')`;
    await db`insert into tables(id,number,capacity) values(${tableId},${randomInt(100000, 900000)},8)`;
    await db`insert into orders(id,table_id) values(${orderId},${tableId})`;
    await db`insert into station_orders(id,order_id,station) values(${ticketId},${orderId},'kitchen')`;
    await db`insert into menu_items(id,name,category_v2,station,max_per_order,is_available) values(${menuId},'Rice','meal','kitchen',3,true)`;
    await db`insert into order_items(order_id,station_order_id,menu_item_id,quantity) values(${orderId},${ticketId},${menuId},2)`;
    await db`insert into order_alerts(station_order_id,station,message,status,attempts,last_attempt_at) values(${ticketId},'kitchen','Table fixture: rice.','failed',1,now())`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from orders where id=${orderId}`;
      await db`delete from tables where id=${tableId}`;
      await db`delete from menu_items where id=${menuId}`;
      await db`delete from staff_pin_attempts where device_id in(select id from registered_devices where registered_by_staff_id=${staffId})`;
      await db`delete from registered_devices where registered_by_staff_id=${staffId}`;
      await db`delete from staff where id=${staffId}`;
      await restore?.();
    } finally {
      await db.end();
    }
  });
  test("failed alerts stay readable while the kitchen board remains usable in every theme", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/kitchen");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const warning = page.getByText(
      "Some WhatsApp alerts could not be confirmed. Keep following this board.",
    );
    await expect(warning).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "Orders, oldest first" })
        .getByText("2 × Rice", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Start preparing table/ }).first()).toBeEnabled();
    mkdirSync("docs/reviews/TICKET-085", { recursive: true });
    for (const theme of Object.values(themes)) {
      await applyTheme(page, theme);
      await expect(warning).toBeVisible();
      const results = await scanA11y(page);
      expect(results).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `docs/reviews/TICKET-085/${info.project.name}-${theme.id}.png`,
        fullPage: true,
      });
    }
    // Status polling is allowed to refresh evidence, but must not replay the failed message.
    await page.reload();
    await expect(warning).toBeVisible();
    const [alert] = await db`select attempts from order_alerts where station_order_id=${ticketId}`;
    expect(alert?.attempts).toBe(1);
  });
});
