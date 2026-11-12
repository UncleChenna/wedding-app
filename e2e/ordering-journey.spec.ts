import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Browser } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { setOrderingOpen } from "./support/ordering-open";
import { localBudgetIdentity } from "./support/local-budget-identity";

/**
 * PRD Journey 3, end to end (TICKET-133): a guest orders food and a drink from their table, the
 * kitchen and bar each see only their part, staff serve it, and the guest's page follows along.
 * Runs in CI on plain Postgres (no Realtime: boards fall back to refetching), and locally with
 * Realtime. Run through `pnpm exec tsx scripts/test-ordering-journey.ts`, which supplies a
 * throwaway staff session secret.
 */
function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const tag = randomUUID().slice(0, 6);
const meal = `Jollof ${tag}`;
const drink = `Zobo ${tag}`;
const ids = { meal: randomUUID(), drink: randomUUID(), kitchen: randomUUID(), bar: randomUUID() };
const pins = { kitchen: String(randomInt(100000, 499999)), bar: String(randomInt(500000, 999999)) };
const table = randomInt(100000, 900000);
let tableId = "";
let db: Sql;
let restoreOrdering: (() => Promise<void>) | undefined;
let restoreSettings: (() => Promise<unknown>) | undefined;

// Without Realtime (CI), a board catches up on its retry refetch, at most ~30s apart.
const BOARD_CATCH_UP = 45_000;

async function staffDevice(browser: Browser, path: string, pin: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(path);
  await page.getByLabel("Your six-digit PIN").fill(pin);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  return { context, page };
}

test.describe("Journey 3: ordering from the table", () => {
  test.skip(process.env.RUN_ORDERING_JOURNEY !== "1", "Run via scripts/test-ordering-journey.ts");
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    // Staff stay signed in until after the event day, which needs a future date and a time zone.
    const [settings] = await db<{ date: string | null; zone: string | null }[]>`
      select event_date::text as date, time_zone as zone from event_settings where id = 1`;
    await db`insert into event_settings (id, event_date, time_zone)
      values (1, (now() + interval '7 days')::date, 'Africa/Lagos')
      on conflict (id) do update set event_date = excluded.event_date, time_zone = excluded.time_zone`;
    restoreSettings = () =>
      settings
        ? db`update event_settings set event_date = ${settings.date}, time_zone = ${settings.zone} where id = 1`
        : db`delete from event_settings where id = 1`;
    restoreOrdering = await setOrderingOpen(db, true);
    await db`delete from request_budgets where identity = ${localBudgetIdentity()}`;
    await db`insert into staff (id, name, role, pin_hash, pin_issued_at, pin_expires_at) values
      (${ids.kitchen}, ${"Journey kitchen " + tag}, 'kitchen', ${credential(pins.kitchen)}, now() - interval '1 minute', now() + interval '1 day'),
      (${ids.bar}, ${"Journey bar " + tag}, 'bar', ${credential(pins.bar)}, now() - interval '1 minute', now() + interval '1 day')`;
    await db`insert into menu_items (id, name, category_v2, station, max_per_order, is_available) values
      (${ids.meal}, ${meal}, 'meal', 'kitchen', 3, true),
      (${ids.drink}, ${drink}, 'soft_drink', 'bar', 3, true)`;
    const [row] = await db<{ id: string }[]>`insert into tables (number, name, capacity)
      values (${table}, ${"Journey " + tag}, 8) returning id`;
    tableId = row?.id ?? "";
  });

  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from orders where table_id = ${tableId}`;
      await db`delete from tables where id = ${tableId}`;
      await db`delete from menu_items where id in (${ids.meal}, ${ids.drink})`;
      const staff = [ids.kitchen, ids.bar];
      await db`delete from staff_pin_attempts where device_id in
        (select id from registered_devices where registered_by_staff_id = any(${staff}))`;
      await db`delete from registered_devices where registered_by_staff_id = any(${staff})`;
      await db`delete from staff where id = any(${staff})`;
    } finally {
      await restoreSettings?.();
      await restoreOrdering?.();
      await db.end();
    }
  });

  test("a guest's order reaches each board, is served, and the guest's page follows", async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const kitchen = await staffDevice(browser, "/kitchen", pins.kitchen);
    const bar = await staffDevice(browser, "/bar", pins.bar);
    const guestContext = await browser.newContext();
    try {
      // The guest orders a meal and a drink from their table.
      const guest = await guestContext.newPage();
      await guest.goto("/order");
      const input = guest.getByLabel("Table number", { exact: true });
      await input.fill(String(table));
      await input.press("Enter");
      await guest.getByRole("button", { name: `Increase ${meal} quantity` }).click();
      await guest.getByRole("button", { name: `Increase ${meal} quantity` }).click();
      await guest.getByRole("button", { name: `Increase ${drink} quantity` }).click();
      await guest.getByLabel("A note for the kitchen or bar").fill("Less pepper");
      await guest.getByRole("button", { name: "Send order" }).click();
      await expect(
        guest.getByRole("heading", { name: "On its way. Sit back, we've got this." }),
      ).toBeVisible();
      await expect(guest.getByText("Received", { exact: true })).toHaveCount(2);

      // Each board gets only its own part of the order.
      const card = (page: typeof guest) =>
        page
          .getByRole("list", { name: "Orders, oldest first" })
          .getByRole("listitem")
          .filter({ hasText: `Table ${table}` });
      await expect(card(kitchen.page)).toBeVisible({ timeout: BOARD_CATCH_UP });
      await expect(card(kitchen.page)).toContainText(`2 × ${meal}`);
      await expect(card(kitchen.page)).toContainText("Less pepper");
      await expect(card(kitchen.page)).not.toContainText(drink);
      await expect(card(bar.page)).toBeVisible({ timeout: BOARD_CATCH_UP });
      await expect(card(bar.page)).toContainText(`1 × ${drink}`);
      await expect(card(bar.page)).not.toContainText(meal);

      // A limit: the same table ordering again straight away is asked to wait.
      await guest.getByRole("button", { name: "Order something else" }).click();
      await guest.getByRole("button", { name: `Increase ${drink} quantity` }).click();
      await guest.getByRole("button", { name: "Send order" }).click();
      await expect(guest.getByText(/last order went in/)).toBeVisible();

      // Staff work through it; the guest's statuses follow (guests poll every 1.5s).
      await kitchen.page.getByRole("button", { name: `Start preparing table ${table}` }).click();
      await bar.page.getByRole("button", { name: `Served table ${table}` }).click();
      await kitchen.page.getByRole("button", { name: `Served table ${table}` }).click();
      await expect(card(kitchen.page)).toHaveCount(0);
      await expect(card(bar.page)).toHaveCount(0);

      // The served card leaves the board as soon as it's tapped; wait for the save itself.
      await expect
        .poll(async () => {
          const rows = await db<{ status: string }[]>`
            select status from orders where table_id = ${tableId}`;
          return rows.map((row) => row.status);
        })
        .toEqual(["served"]);
    } finally {
      await guestContext.close();
      await kitchen.context.close();
      await bar.context.close();
    }
  });

  test("the guest's confirmation follows the boards to served", async ({ browser }) => {
    test.setTimeout(180_000);
    await db`delete from request_budgets where identity = ${localBudgetIdentity()}`;
    const kitchen = await staffDevice(browser, "/kitchen", pins.kitchen);
    const guestContext = await browser.newContext();
    try {
      const guest = await guestContext.newPage();
      // A fresh table, so the previous test's cooldown doesn't apply.
      const second = randomInt(100000, 900000);
      const [row] = await db<{ id: string }[]>`insert into tables (number, name, capacity)
        values (${second}, ${"Journey " + tag}, 8) returning id`;
      await guest.goto("/order");
      const input = guest.getByLabel("Table number", { exact: true });
      await input.fill(String(second));
      await input.press("Enter");
      await guest.getByRole("button", { name: `Increase ${meal} quantity` }).click();
      await guest.getByRole("button", { name: "Send order" }).click();
      await expect(guest.getByText("Received", { exact: true })).toBeVisible();

      const card = kitchen.page
        .getByRole("list", { name: "Orders, oldest first" })
        .getByRole("listitem")
        .filter({ hasText: `Table ${second}` });
      await expect(card).toBeVisible({ timeout: BOARD_CATCH_UP });
      await kitchen.page.getByRole("button", { name: `Start preparing table ${second}` }).click();
      await expect(guest.getByText("Being prepared", { exact: true })).toBeVisible({
        timeout: 5_000,
      });
      await kitchen.page.getByRole("button", { name: `Served table ${second}` }).click();
      await expect(guest.getByText("Served. Enjoy every bite.", { exact: true })).toBeVisible({
        timeout: 5_000,
      });
      await db`delete from orders where table_id = ${row?.id ?? ""}`;
      await db`delete from tables where id = ${row?.id ?? ""}`;
    } finally {
      await guestContext.close();
      await kitchen.context.close();
    }
  });
});
