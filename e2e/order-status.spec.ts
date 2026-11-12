import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { scanA11y } from "./support/axe";
import { setOrderingOpen } from "./support/ordering-open";
import { applyTheme } from "./support/theme";

/**
 * TICKET-075 on a production build against this worktree's local Supabase stack:
 * RUN_ORDER_STATUS_E2E=1 pnpm exec playwright test e2e/order-status.spec.ts --project=mobile
 * Needs STAFF_SESSION_SECRET (the kitchen tablet signs in) and SUPABASE_JWT_SECRET.
 */
function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const tag = `TICKET-075 ${randomUUID()}`;
const staffId = randomUUID();
const pin = String(randomInt(100000, 999999));
const meal = `Suya ${tag.slice(-6)}`;
const mealId = randomUUID();
const table = randomInt(100000, 900000);
let tableId = "";
let db: Sql;
let restoreOrdering: (() => Promise<void>) | undefined;
let restoreSettings: (() => Promise<unknown>) | undefined;

test.describe("guest order status", () => {
  test.skip(process.env.RUN_ORDER_STATUS_E2E !== "1", "Needs a local stack and a built app");

  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    restoreOrdering = await setOrderingOpen(db, true);
    const [settings] = await db<{ date: string | null; zone: string | null }[]>`
      select event_date::text as date, time_zone as zone from event_settings where id = 1`;
    await db`update event_settings set event_date = (now() + interval '7 days')::date,
      time_zone = 'Africa/Lagos' where id = 1`;
    restoreSettings = () =>
      db`update event_settings set event_date = ${settings?.date ?? null}, time_zone = ${settings?.zone ?? null} where id = 1`;
    await db`insert into staff(id, name, role, pin_hash, pin_issued_at, pin_expires_at)
      values (${staffId}, ${tag}, 'kitchen', ${credential(pin)}, now() - interval '1 minute', now() + interval '1 day')`;
    await db`insert into menu_items(id, name, category_v2, station, max_per_order, is_available)
      values (${mealId}, ${meal}, 'meal', 'kitchen', 5, true)`;
    const [row] = await db<{ id: string }[]>`insert into tables(number, name, capacity)
      values (${table}, ${tag}, 8) returning id`;
    tableId = row?.id ?? "";
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from orders where table_id = ${tableId}`;
      await db`delete from tables where id = ${tableId}`;
      await db`delete from menu_items where id = ${mealId}`;
      await db`delete from staff_pin_attempts where device_id in
        (select id from registered_devices where registered_by_staff_id = ${staffId})`;
      await db`delete from registered_devices where registered_by_staff_id = ${staffId}`;
      await db`delete from staff where id = ${staffId}`;
    } finally {
      await restoreSettings?.();
      await restoreOrdering?.();
      await db.end();
    }
  });

  test("the guest's page follows the kitchen through preparing and served within 2 seconds", async ({
    browser,
  }, info) => {
    test.setTimeout(180_000);
    const guestContext = await browser.newContext();
    const kitchenContext = await browser.newContext();
    try {
      const guest = await guestContext.newPage();
      const receipts: string[] = [];
      guest.on("request", (request) => {
        const match = /\/api\/orders\/([^/]+)\/status/.exec(request.url());
        if (match?.[1]) receipts.push(match[1]);
      });
      await guest.goto("/order");
      const input = guest.getByLabel("Table number", { exact: true });
      await input.fill(String(table));
      await input.press("Enter");
      await guest.getByRole("button", { name: `Increase ${meal} quantity` }).click();
      await guest.getByRole("button", { name: "Send order" }).click();
      await expect(
        guest.getByRole("heading", { name: "On its way. Sit back, we've got this." }),
      ).toBeVisible();
      await expect(guest.getByText("Received", { exact: true })).toBeVisible();

      const kitchen = await kitchenContext.newPage();
      await kitchen.goto("/kitchen");
      await kitchen.getByLabel("Your six-digit PIN").fill(pin);
      await kitchen.getByRole("button", { name: "Sign in", exact: true }).click();
      await kitchen.getByRole("button", { name: `Start preparing table ${table}` }).click();
      const preparing = Date.now();
      await expect(guest.getByText("Being prepared", { exact: true })).toBeVisible({
        timeout: 2_000,
      });
      expect(Date.now() - preparing).toBeLessThan(2_000);

      await kitchen.getByRole("button", { name: `Served table ${table}` }).click();
      const served = Date.now();
      await expect(guest.getByText("Served. Enjoy every bite.", { exact: true })).toBeVisible({
        timeout: 2_000,
      });
      expect(Date.now() - served).toBeLessThan(2_000);

      // The receipt the page polls is the server's v4 order id, and the response is statuses only.
      const [receipt] = receipts;
      expect(receipt).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      const answer = await guestContext.request.get(`/api/orders/${receipt}/status`);
      expect(await answer.json()).toEqual({ stations: [{ station: "kitchen", status: "served" }] });
      const guessed = await guestContext.request.get(`/api/orders/${randomUUID()}/status`);
      expect(guessed.status()).toBe(404);
      // Polling is gentle (about every 1.5s), and stops once settled.
      expect(receipts.length).toBeLessThan(20);
      const settledAt = receipts.length;
      await guest.waitForTimeout(4_000);
      expect(receipts.length).toBe(settledAt);

      // Guest page: every theme at every review width.
      for (const theme of themes)
        for (const width of [375, 768, 1280]) {
          await guest.setViewportSize({ width, height: 900 });
          await applyTheme(guest, theme);
          expect(await scanA11y(guest), `${theme.id} ${width}`).toEqual([]);
          expect(
            await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          const dir = `docs/reviews/TICKET-075/${info.project.name}/${theme.id}`;
          mkdirSync(dir, { recursive: true });
          await guest.screenshot({ path: `${dir}/${width}-served.png`, fullPage: true });
        }
    } finally {
      await guestContext.close();
      await kitchenContext.close();
    }
  });
});
