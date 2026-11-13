import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { localBudgetIdentity } from "./support/local-budget-identity";

/**
 * TICKET-082 on a production build against this worktree's local Supabase stack:
 * RUN_HOST_E2E=1 pnpm exec playwright test e2e/table-host.spec.ts --project=mobile
 * Needs STAFF_SESSION_SECRET.
 */
function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const tag = `TICKET-082 ${randomUUID()}`;
const hostId = randomUUID();
const pin = String(randomInt(100000, 999999));
const menu = { meal: randomUUID(), drink: randomUUID() };
const tables: { id: string; number: number }[] = [];
let db: Sql;
let restoreSettings: (() => Promise<unknown>) | undefined;

async function table() {
  const number = randomInt(100000, 900000);
  const [row] = await db<{ id: string }[]>`insert into tables(number, name, capacity)
    values (${number}, 'Iroko', 8) returning id`;
  const created = { id: row?.id ?? "", number };
  tables.push(created);
  return created;
}

async function order(tableId: string) {
  const [created] = await db<{ id: string }[]>`insert into orders(table_id, notes)
    values (${tableId}, 'By the window') returning id`;
  for (const [station, item] of [
    ["kitchen", menu.meal],
    ["bar", menu.drink],
  ] as const) {
    const [ticket] = await db<{ id: string }[]>`insert into station_orders(order_id, station)
      values (${created?.id ?? ""}, ${station}) returning id`;
    await db`insert into order_items(order_id, station_order_id, menu_item_id, quantity)
      values (${created?.id ?? ""}, ${ticket?.id ?? ""}, ${item}, 2)`;
  }
}

async function signIn(page: Page) {
  await page.goto("/host");
  await page.getByLabel("Your six-digit PIN").fill(pin);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

test.describe("table host board", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(process.env.RUN_HOST_E2E !== "1", "Needs a local stack");

  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    // Staff access ends after the event day: set a future date and a time zone, then restore.
    const [settings] = await db<{ date: string | null; zone: string | null }[]>`
      select event_date::text as date, time_zone as zone from event_settings where id = 1`;
    await db`insert into event_settings(id, event_date, time_zone)
      values (1, (now() + interval '7 days')::date, 'Africa/Lagos')
      on conflict (id) do update set event_date = excluded.event_date, time_zone = excluded.time_zone`;
    restoreSettings = () =>
      settings
        ? db`update event_settings set event_date = ${settings.date}, time_zone = ${settings.zone} where id = 1`
        : db`delete from event_settings where id = 1`;
    await db`insert into staff(id, name, role, pin_hash, pin_issued_at, pin_expires_at)
      values (${hostId}, ${tag}, 'host', ${credential(pin)}, now() - interval '1 minute', now() + interval '1 day')`;
    await db`insert into menu_items(id, name, category_v2, station, max_per_order, is_available)
      values (${menu.meal}, ${"Suya " + tag.slice(-6)}, 'meal', 'kitchen', 5, true),
        (${menu.drink}, ${"Zobo " + tag.slice(-6)}, 'soft_drink', 'bar', 5, true)`;
  });
  test.beforeEach(async () => {
    await db`delete from request_budgets where scope = 'pin' and identity = ${localBudgetIdentity()}`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      const ids = tables.map((row) => row.id);
      if (ids.length) {
        await db`delete from orders where table_id in ${db(ids)}`;
        await db`delete from tables where id in ${db(ids)}`;
      }
      await db`delete from menu_items where id in ${db(Object.values(menu))}`;
      await db`delete from staff_pin_attempts where device_id in
        (select id from registered_devices where registered_by_staff_id = ${hostId})`;
      await db`delete from registered_devices where registered_by_staff_id = ${hostId}`;
      await db`delete from staff where id = ${hostId}`;
      await restoreSettings?.();
    } finally {
      await db.end();
    }
  });

  test("a host sees only their tables' orders and marks them served", async ({ page }) => {
    test.setTimeout(120_000);
    const [mine, theirs] = [await table(), await table()];
    await db`insert into host_tables(staff_id, table_id) values (${hostId}, ${mine.id})`;
    await order(mine.id);
    await order(theirs.id);

    await signIn(page);
    await expect(page.getByText(`Tables ${mine.number}`)).toBeVisible();
    const list = page.getByRole("list", { name: "Orders, oldest first" });
    await expect(list.getByRole("heading", { level: 3 })).toHaveCount(2);
    await expect(list).toContainText(`Table ${mine.number}`);
    await expect(list).not.toContainText(`Table ${theirs.number}`);
    await expect(list).toContainText("Food");
    await expect(list).toContainText("Drinks");
    // Hosts serve; preparing and cancelling stay with the kitchen and bar.
    await expect(page.getByRole("button", { name: /Cancel|Start preparing/ })).toHaveCount(0);

    // Staff screens: an axe scan in every theme at 375px and one screenshot.
    await page.setViewportSize({ width: 375, height: 900 });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page), theme.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    const dir = "docs/reviews/TICKET-082";
    mkdirSync(dir, { recursive: true });
    const [theme] = themes;
    if (theme) await applyTheme(page, theme);
    await page.screenshot({ path: `${dir}/375-host-board.png`, fullPage: true });

    await page.getByRole("button", { name: `Served table ${mine.number}, food` }).click();
    await expect(list.getByRole("heading", { level: 3 })).toHaveCount(1);
    await page.getByRole("button", { name: `Served table ${mine.number}, drinks` }).click();
    await expect(page.getByRole("heading", { name: "Nothing to bring out" })).toBeVisible();
    // The card leaves at once; the save lands a moment later.
    await expect
      .poll(async () => {
        const [row] = await db<{ status: string }[]>`
          select status from orders where table_id = ${mine.id}`;
        return row?.status;
      })
      .toBe("served");
    const [untouched] = await db<{ status: string }[]>`
      select status from orders where table_id = ${theirs.id}`;
    expect(untouched?.status).toBe("received");
  });

  test("the host API refuses to cancel", async ({ page }) => {
    await signIn(page);
    const status = await page.evaluate(async () => {
      const response = await fetch("/api/host/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationOrderId: crypto.randomUUID(),
          from: "received",
          to: "cancelled",
          reason: "No",
        }),
      });
      return response.status;
    });
    expect(status).toBe(400);
  });
});
