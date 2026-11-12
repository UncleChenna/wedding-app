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
 * TICKET-076 and TICKET-077 on a production build against this worktree's local Supabase stack
 * (Realtime on): RUN_KITCHEN_BOARD_E2E=1 pnpm exec playwright test e2e/station-boards.spec.ts --project=mobile
 * Needs STAFF_SESSION_SECRET and SUPABASE_JWT_SECRET (pnpm db:start fills the latter).
 */
function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const tag = `TICKET-076 ${randomUUID()}`;
const staffId = randomUUID();
const barStaffId = randomUUID();
const pin = String(randomInt(100000, 499999));
const barPin = String(randomInt(500000, 999999));
const menuId = randomUUID();
const drinkId = randomUUID();
const tableIds: string[] = [];
const invitationIds: string[] = [];
let db: Sql;
let restoreSettings: (() => Promise<unknown>) | undefined;

/** Writes an order the way createOrder does, including its broadcast, in one transaction. */
async function placeOrder(item: string, quantity: number, dietary?: string, drinks = 0) {
  const number = randomInt(100000, 900000);
  return db.begin(async (tx) => {
    const [table] = await tx<{ id: string }[]>`insert into tables(number, name, capacity)
      values (${number}, 'Baobab', 8) returning id`;
    if (!table) throw new Error("no table");
    tableIds.push(table.id);
    if (dietary) {
      const [invitation] = await tx<
        { id: string }[]
      >`insert into invitations(token, household_name, status, table_id)
        values (${randomBytes(32).toString("base64url")}, ${tag}, 'rsvp_yes', ${table.id}) returning id`;
      invitationIds.push(invitation?.id ?? "");
      await tx`insert into guests(invitation_id, name, dietary_notes)
        values (${invitation?.id ?? ""}, 'Ada Obi', ${dietary})`;
    }
    const [order] = await tx<{ id: string }[]>`insert into orders(table_id, notes)
      values (${table.id}, ${"No pepper"}) returning id`;
    const lines = [
      { station: "kitchen", menuItem: menuId, quantity },
      { station: "bar", menuItem: drinkId, quantity: drinks },
    ].filter((line) => line.quantity > 0);
    for (const line of lines) {
      const [ticket] = await tx<{ id: string }[]>`insert into station_orders(order_id, station)
        values (${order?.id ?? ""}, ${line.station}) returning id`;
      await tx`insert into order_items(order_id, station_order_id, menu_item_id, quantity)
        values (${order?.id ?? ""}, ${ticket?.id ?? ""}, ${line.menuItem}, ${line.quantity})`;
      await tx`select realtime.send(${tx.json({
        stationOrderId: ticket?.id ?? "",
        orderId: order?.id ?? "",
        status: "received",
      })}, 'order.changed', ${"station:" + line.station}, true)`;
    }
    return { number, item };
  });
}

async function chimes(page: Page) {
  return page.evaluate(() => (window as unknown as { __chimes: number }).__chimes);
}

test.describe("kitchen board", () => {
  // The tests share the event settings that keep staff signed in; parallel workers restoring
  // them would sign each other out mid-test.
  test.describe.configure({ mode: "serial" });
  test.skip(process.env.RUN_KITCHEN_BOARD_E2E !== "1", "Needs a local stack with Realtime");

  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    // Staff access ends after the event day, so sign-in needs an event date in the future and
    // a time zone. Seeded data may lack the time zone; set both for this run and put them back.
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
      values (${staffId}, ${tag}, 'kitchen', ${credential(pin)}, now() - interval '1 minute', now() + interval '1 day')`;
    await db`insert into menu_items(id, name, category_v2, station, max_per_order, is_available)
      values (${menuId}, ${"Pepper soup " + tag.slice(-6)}, 'meal', 'kitchen', 5, true),
        (${drinkId}, ${"Chapman " + tag.slice(-6)}, 'soft_drink', 'bar', 5, true)`;
    await db`insert into staff(id, name, role, pin_hash, pin_issued_at, pin_expires_at)
      values (${barStaffId}, ${tag + " bar"}, 'bar', ${credential(barPin)}, now() - interval '1 minute', now() + interval '1 day')`;
  });
  // Every test signs devices in with PINs; repeated local runs would otherwise use up the
  // localhost PIN budget (30 per 10 minutes) and fail at sign-in.
  test.beforeEach(async () => {
    await db`delete from request_budgets where scope = 'pin' and identity = ${localBudgetIdentity()}`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (tableIds.length) await db`delete from orders where table_id in ${db(tableIds)}`;
      if (invitationIds.length) await db`delete from invitations where id in ${db(invitationIds)}`;
      if (tableIds.length) await db`delete from tables where id in ${db(tableIds)}`;
      await db`delete from menu_items where id in (${menuId}, ${drinkId})`;
      await db`delete from staff_pin_attempts where device_id in
        (select id from registered_devices where registered_by_staff_id in (${staffId}, ${barStaffId}))`;
      await db`delete from registered_devices where registered_by_staff_id in (${staffId}, ${barStaffId})`;
      await db`delete from staff where id in (${staffId}, ${barStaffId})`;
      await restoreSettings?.();
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
    // Signed in: the board's own heading and sign-out, not the sign-in page with the same title.
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /orders? waiting/ })).toBeVisible();
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

    const second = await placeOrder("second", 3, "Nut allergy");
    const secondCard = page.getByRole("listitem").filter({ hasText: `Table ${second.number}` });
    await expect(secondCard).toBeVisible({ timeout: 2_000 });
    await expect(secondCard).toContainText("3 ×");
    await expect(secondCard).toContainText("No pepper");
    // The kitchen, and only the kitchen, sees the table's dietary notes (PRD privacy rule).
    await expect(secondCard).toContainText("Ada Obi: Nut allergy");
    await expect(firstCard).not.toContainText("Dietary");
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

  test("drinks go only to /bar, food only to /kitchen, and a bar PIN can't open the kitchen", async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const signIn = async (path: string, code: string) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(path);
      await page.getByLabel("Your six-digit PIN").fill(code);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      return { context, page };
    };
    const kitchen = await signIn("/kitchen", pin);
    const bar = await signIn("/bar", barPin);
    try {
      for (const { page } of [kitchen, bar]) {
        await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
        await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible({
          timeout: 15_000,
        });
      }
      await expect(bar.page.getByRole("heading", { name: "Bar board", level: 1 })).toBeVisible();

      // One guest order with food and drinks splits into a ticket per station.
      const mixed = await placeOrder("mixed", 2, "Shellfish allergy", 3);
      const kitchenCard = kitchen.page
        .getByRole("listitem")
        .filter({ hasText: `Table ${mixed.number}` });
      const barCard = bar.page.getByRole("listitem").filter({ hasText: `Table ${mixed.number}` });
      await expect(kitchenCard).toBeVisible({ timeout: 2_000 });
      await expect(barCard).toBeVisible({ timeout: 2_000 });
      await expect(kitchenCard).toContainText("Pepper soup");
      await expect(kitchenCard).not.toContainText("Chapman");
      await expect(barCard).toContainText("3 × Chapman");
      await expect(barCard).not.toContainText("Pepper soup");
      // Dietary notes are the kitchen's only.
      await expect(kitchenCard).toContainText("Shellfish allergy");
      await expect(barCard).not.toContainText("Shellfish");
      await expect(barCard).not.toContainText("Dietary");

      // A drinks-only order never reaches the kitchen.
      const drinksOnly = await placeOrder("drinks", 0, undefined, 1);
      await expect(
        bar.page.getByRole("listitem").filter({ hasText: `Table ${drinksOnly.number}` }),
      ).toBeVisible({ timeout: 2_000 });
      await bar.page.waitForTimeout(1_000);
      await expect(
        kitchen.page.getByRole("listitem").filter({ hasText: `Table ${drinksOnly.number}` }),
      ).toHaveCount(0);

      // The bar device can't open the kitchen board or read its data.
      await bar.page.goto("/kitchen");
      await expect(bar.page.getByLabel("Your six-digit PIN")).toBeVisible();
      await expect(bar.page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
      expect((await bar.context.request.get("/api/kitchen/board")).status()).toBe(403);
      expect((await kitchen.context.request.get("/api/bar/board")).status()).toBe(403);
      // And the bar PIN doesn't sign in at the kitchen.
      await bar.page.getByLabel("Your six-digit PIN").fill(barPin);
      await bar.page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(bar.page.getByRole("button", { name: "Sign out" })).toHaveCount(0);

      await bar.page.goto("/bar");
      await bar.page.setViewportSize({ width: 375, height: 900 });
      for (const theme of themes) {
        await applyTheme(bar.page, theme);
        expect(await scanA11y(bar.page), theme.id).toEqual([]);
      }
      const [theme] = themes;
      if (theme) await applyTheme(bar.page, theme);
      mkdirSync("docs/reviews/TICKET-077", { recursive: true });
      await bar.page.screenshot({ path: "docs/reviews/TICKET-077/375-bar-board.png" });
    } finally {
      await kitchen.context.close();
      await bar.context.close();
    }
  });

  test("staff move an order to served, a failed save reverts, and cancelling needs a reason", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/kitchen");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible({
      timeout: 15_000,
    });
    const served = await placeOrder("served", 1);
    const failing = await placeOrder("failing", 1);
    const cancelled = await placeOrder("cancelled", 1);
    const card = (number: number) =>
      page
        .getByRole("list", { name: "Orders, oldest first" })
        .getByRole("listitem")
        .filter({
          hasText: `Table ${number}`,
        });
    await expect(card(cancelled.number)).toBeVisible({ timeout: 2_000 });

    // Received → preparing → served; it leaves the queue for "Recently done".
    await page.getByRole("button", { name: `Start preparing table ${served.number}` }).click();
    await expect(card(served.number)).toContainText("Preparing");
    await page.getByRole("button", { name: `Served table ${served.number}` }).click();
    await expect(card(served.number)).toHaveCount(0);
    const recent = page.locator("details").filter({ hasText: "Recently done" });
    await recent.locator("summary").click();
    await expect(recent).toContainText(`Table ${served.number} · Served`);

    // A forced failure: the card comes straight back and the board says so.
    await page.route("**/api/kitchen/tickets", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
    );
    await page.getByRole("button", { name: `Served table ${failing.number}` }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: `Table ${failing.number} didn’t update` }),
    ).toBeVisible();
    await expect(card(failing.number)).toBeVisible();
    await expect(card(failing.number)).toContainText("Waiting");
    await page.unroute("**/api/kitchen/tickets");

    // Cancelling asks for confirmation and a reason.
    await page.getByRole("button", { name: `Cancel table ${cancelled.number}` }).click();
    const sheet = page.getByRole("dialog", { name: `Cancel table ${cancelled.number}’s order?` });
    await expect(sheet).toBeVisible();
    await page.setViewportSize({ width: 375, height: 900 });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page), theme.id).toEqual([]);
    }
    await sheet.getByRole("button", { name: "Cancel order" }).click();
    await expect(sheet.getByText("Say why, so the guests can be told.")).toBeVisible();
    await expect(card(cancelled.number)).toBeVisible();
    mkdirSync("docs/reviews/TICKET-078", { recursive: true });
    await page.screenshot({ path: "docs/reviews/TICKET-078/375-cancel-sheet.png" });
    await sheet.getByLabel("Reason").fill("Guest left early");
    await sheet.getByRole("button", { name: "Cancel order" }).click();
    await expect(card(cancelled.number)).toHaveCount(0);
    await expect(recent).toContainText(`Table ${cancelled.number} · Cancelled`);

    const events = await db<{ to_status: string; reason: string | null }[]>`
      select e.to_status, e.reason from station_order_events e
      join station_orders s on s.id = e.station_order_id
      join orders o on o.id = s.order_id join tables t on t.id = o.table_id
      where t.number in (${served.number}, ${failing.number}, ${cancelled.number})
      order by e.created_at`;
    expect(events).toEqual([
      { to_status: "preparing", reason: null },
      { to_status: "served", reason: null },
      { to_status: "cancelled", reason: "Guest left early" },
    ]);
    await page.getByRole("list", { name: "Orders, oldest first" }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: "docs/reviews/TICKET-078/375-board-actions.png" });
  });

  test("a waiter enters an order from the board; it reaches both boards flagged and skips the cooldown", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const number = randomInt(100000, 900000);
    const [row] = await db<{ id: string }[]>`insert into tables(number, name, capacity)
      values (${number}, 'Baobab', 8) returning id`;
    tableIds.push(row?.id ?? "");
    const signIn = async (path: string, code: string) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(path);
      await page.getByLabel("Your six-digit PIN").fill(code);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible({
        timeout: 15_000,
      });
      return { context, page };
    };
    const kitchen = await signIn("/kitchen", pin);
    const bar = await signIn("/bar", barPin);
    try {
      const enter = async (food: number, drinks: number) => {
        await kitchen.page.getByRole("button", { name: "New order" }).click();
        const sheet = kitchen.page.getByRole("dialog", { name: "New order for a table" });
        await sheet.getByLabel("Table number").fill(String(number));
        for (let i = 0; i < food; i++)
          await sheet
            .getByRole("button", { name: `Increase Pepper soup ${tag.slice(-6)} quantity` })
            .click();
        for (let i = 0; i < drinks; i++)
          await sheet
            .getByRole("button", { name: `Increase Chapman ${tag.slice(-6)} quantity` })
            .click();
        return sheet;
      };
      const sheet = await enter(2, 1);
      await kitchen.page.setViewportSize({ width: 375, height: 900 });
      for (const theme of themes) {
        await applyTheme(kitchen.page, theme);
        expect(await scanA11y(kitchen.page), theme.id).toEqual([]);
      }
      mkdirSync("docs/reviews/TICKET-079", { recursive: true });
      await kitchen.page.screenshot({ path: "docs/reviews/TICKET-079/375-new-order-sheet.png" });
      await sheet.getByRole("button", { name: "Send order" }).click();
      await expect(
        kitchen.page.getByRole("status").filter({ hasText: `Order sent for table ${number}.` }),
      ).toBeVisible();

      const kitchenCard = kitchen.page
        .getByRole("list", { name: "Orders, oldest first" })
        .getByRole("listitem")
        .filter({ hasText: `Table ${number}` });
      const barCard = bar.page
        .getByRole("list", { name: "Orders, oldest first" })
        .getByRole("listitem")
        .filter({ hasText: `Table ${number}` });
      await expect(kitchenCard).toContainText("Staff order");
      await expect(kitchenCard).toContainText("2 × Pepper soup");
      await expect(barCard).toContainText("Staff order", { timeout: 2_000 });
      await expect(barCard).toContainText("1 × Chapman");

      // Straight away, a second order for the same table: a guest's phone would hit the cooldown.
      await (await enter(1, 0)).getByRole("button", { name: "Send order" }).click();
      await expect(
        kitchen.page.getByRole("status").filter({ hasText: `Order sent for table ${number}.` }),
      ).toBeVisible();
      await expect(kitchenCard).toHaveCount(2);

      const stored = await db<{ staff: string | null }[]>`
        select entered_by_staff_id as staff from orders where table_id = ${row?.id ?? ""}`;
      expect(stored).toEqual([{ staff: staffId }, { staff: staffId }]);
      await kitchenCard.first().scrollIntoViewIfNeeded();
      await kitchen.page.screenshot({ path: "docs/reviews/TICKET-079/375-staff-order-card.png" });
    } finally {
      await kitchen.context.close();
      await bar.context.close();
    }
  });
});
