import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

/**
 * TICKET-076 on a production build against this worktree's local Supabase stack (Realtime on):
 * RUN_KITCHEN_BOARD_E2E=1 pnpm exec playwright test e2e/kitchen-board.spec.ts --project=mobile
 * Needs STAFF_SESSION_SECRET and SUPABASE_JWT_SECRET (pnpm db:start fills the latter).
 */
function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const tag = `TICKET-076 ${randomUUID()}`;
const staffId = randomUUID();
const pin = String(randomInt(100000, 999999));
const menuId = randomUUID();
const tableIds: string[] = [];
let db: Sql;

/** Writes an order the way createOrder does, including its broadcast, in one transaction. */
async function placeOrder(item: string, quantity: number) {
  const number = randomInt(100000, 900000);
  return db.begin(async (tx) => {
    const [table] = await tx<{ id: string }[]>`insert into tables(number, name, capacity)
      values (${number}, ${tag}, 8) returning id`;
    if (!table) throw new Error("no table");
    tableIds.push(table.id);
    const [order] = await tx<{ id: string }[]>`insert into orders(table_id, notes)
      values (${table.id}, ${"No pepper"}) returning id`;
    const [ticket] = await tx<{ id: string }[]>`insert into station_orders(order_id, station)
      values (${order?.id ?? ""}, 'kitchen') returning id`;
    await tx`insert into order_items(order_id, station_order_id, menu_item_id, quantity)
      values (${order?.id ?? ""}, ${ticket?.id ?? ""}, ${menuId}, ${quantity})`;
    await tx`select realtime.send(${tx.json({
      stationOrderId: ticket?.id ?? "",
      orderId: order?.id ?? "",
      status: "received",
    })}, 'order.changed', 'station:kitchen', true)`;
    return { number, item };
  });
}

async function chimes(page: Page) {
  return page.evaluate(() => (window as unknown as { __chimes: number }).__chimes);
}

test.describe("kitchen board", () => {
  test.skip(process.env.RUN_KITCHEN_BOARD_E2E !== "1", "Needs a local stack with Realtime");

  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    await db`insert into staff(id, name, role, pin_hash, pin_issued_at, pin_expires_at)
      values (${staffId}, ${tag}, 'kitchen', ${credential(pin)}, now() - interval '1 minute', now() + interval '1 day')`;
    await db`insert into menu_items(id, name, category_v2, station, max_per_order, is_available)
      values (${menuId}, ${"Pepper soup " + tag.slice(-6)}, 'meal', 'kitchen', 5, true)`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (tableIds.length) await db`delete from orders where table_id in ${db(tableIds)}`;
      if (tableIds.length) await db`delete from tables where id in ${db(tableIds)}`;
      await db`delete from menu_items where id = ${menuId}`;
      await db`delete from staff_pin_attempts where device_id in
        (select id from registered_devices where registered_by_staff_id = ${staffId})`;
      await db`delete from registered_devices where registered_by_staff_id = ${staffId}`;
      await db`delete from staff where id = ${staffId}`;
    } finally {
      await db.end();
    }
  });

  test("new orders appear oldest first within 2 seconds, chime when sound is on and flash", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // Count chimes: each one starts two oscillators.
    await page.addInitScript(() => {
      const state = window as unknown as { __chimes: number };
      state.__chimes = 0;
      const original = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function (this: AudioContext) {
        state.__chimes += 0.5;
        return original.call(this);
      };
    });
    await page.goto("/kitchen");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kitchen board", exact: true })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible({
      timeout: 15_000,
    });

    // Without sound the board still flashes: the visual cue doesn't depend on audio.
    const first = await placeOrder("first", 1);
    const started = Date.now();
    const firstCard = page.getByRole("listitem").filter({ hasText: `Table ${first.number}` });
    await expect(firstCard).toBeVisible({ timeout: 2_000 });
    expect(Date.now() - started).toBeLessThan(2_000);
    await expect(firstCard.getByText("New", { exact: true })).toBeVisible();
    expect(await chimes(page)).toBe(0);

    await page.getByRole("button", { name: "Turn on sound" }).click();
    await expect(page.getByText("Sound on")).toBeVisible();
    const afterUnlock = await chimes(page);

    const second = await placeOrder("second", 3);
    const secondCard = page.getByRole("listitem").filter({ hasText: `Table ${second.number}` });
    await expect(secondCard).toBeVisible({ timeout: 2_000 });
    await expect(secondCard).toContainText("3 ×");
    await expect(secondCard).toContainText("No pepper");
    await expect.poll(() => chimes(page)).toBeGreaterThan(afterUnlock);

    // Oldest first: the first order's card comes before the second's.
    const order = await page
      .getByRole("list", { name: "Orders, oldest first" })
      .getByRole("heading", { level: 3 })
      .allTextContents();
    const firstIndex = order.findIndex((text) => text.includes(`Table ${first.number}`));
    const secondIndex = order.findIndex((text) => text.includes(`Table ${second.number}`));
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(firstIndex).toBeLessThan(secondIndex);

    // Staff screens: an axe scan in every theme at 375px and one screenshot.
    await page.setViewportSize({ width: 375, height: 900 });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page), theme.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    const dir = "docs/reviews/TICKET-076";
    mkdirSync(dir, { recursive: true });
    const [theme] = themes;
    if (theme) await applyTheme(page, theme);
    await secondCard.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/375-kitchen-board.png` });
  });
});
