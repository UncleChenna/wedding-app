import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("order submission on a flaky network", () => {
  test.skip(process.env.RUN_ORDER_BROWSER_TESTS !== "1", "Requires isolated local order fixtures");
  let db: Sql;
  let table: number;
  let tableId: string | undefined;
  const itemIds: string[] = [];
  const tag = "TICKET-072 fixture " + randomInt(100000, 900000);
  const meal = tag + " rice";
  const drink = tag + " punch";

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    table = randomInt(100000, 900000);
    const [row] = await db<
      { id: string }[]
    >`insert into tables(number,name,capacity) values(${table},${tag},4) returning id`;
    tableId = row?.id;
    for (const [name, category, station] of [
      [meal, "meal", "kitchen"],
      [drink, "soft_drink", "bar"],
    ] as const) {
      const [item] = await db<{ id: string }[]>`
        insert into menu_items(name, description, category_v2, station, sort_order, max_per_order)
        values(${name}, 'A fixture for the order test.', ${category}, ${station}, -1000, 3)
        returning id`;
      if (!item) throw new Error("Missing fixture");
      itemIds.push(item.id);
    }
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (tableId) await db`delete from orders where table_id = ${tableId}`;
      if (itemIds.length) await db`delete from menu_items where id in ${db(itemIds)}`;
      if (tableId) await db`delete from tables where id = ${tableId}`;
    } finally {
      await db.end();
    }
  });

  async function openMenu(page: Page) {
    await page.goto("/order");
    const input = page.getByLabel("Table number", { exact: true });
    await input.fill(String(table));
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "What can we bring you?" })).toBeVisible();
  }
  const orderCount = async () =>
    (
      await db<
        { n: number }[]
      >`select count(*)::int as n from orders where table_id = ${tableId ?? ""}`
    )[0]?.n;

  test("three lost responses still create exactly one order", async ({ page }) => {
    let calls = 0;
    // The server receives and commits each attempt, then the network drops its answer.
    await page.route("**/api/orders", async (route) => {
      calls++;
      if (calls <= 3) {
        await route.fetch();
        await route.abort("connectionreset");
        return;
      }
      await route.continue();
    });
    await openMenu(page);
    await page.getByRole("button", { name: "Increase " + meal + " quantity" }).click();
    await page.getByRole("button", { name: "Increase " + drink + " quantity" }).click();
    await page.getByLabel("A note for the kitchen or bar").fill("No pepper, <b>please</b>");
    const before = await orderCount();
    await page.getByRole("button", { name: "Send order" }).click();
    await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
    await expect(
      page.getByText("Still sending. The signal is slow, so we're trying again."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "On its way. Sit back, we've got this." }),
    ).toBeVisible({ timeout: 15_000 });
    expect(calls).toBe(4);
    expect(await orderCount()).toBe((before ?? 0) + 1);
    const [stored] = await db<
      { notes: string | null; items: number; stations: number }[]
    >`select o.notes, (select count(*)::int from order_items i where i.order_id = o.id) as items, (select count(*)::int from station_orders s where s.order_id = o.id) as stations from orders o where o.table_id = ${tableId ?? ""} order by o.created_at desc limit 1`;
    expect(stored).toEqual({ notes: "No pepper, <b>please</b>", items: 2, stations: 2 });
    // One confirmation, grouped the way the kitchen and bar will each receive it.
    await expect(page.getByRole("list", { name: "From the kitchen" })).toContainText(meal);
    await expect(page.getByRole("list", { name: "From the bar" })).toContainText(drink);
    // Plain text: the note renders as typed, never as markup.
    await expect(page.getByText("Your note: No pepper, <b>please</b>")).toBeVisible();

    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const dir = "docs/reviews/TICKET-074/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page
          .getByRole("heading", { name: "On its way. Sit back, we've got this." })
          .scrollIntoViewIfNeeded();
        await page.screenshot({ path: dir + "/" + width + "-sent.png" });
      }
  });

  test("a dead connection shows the failed state and the retry sends once", async ({ page }) => {
    let reachable = false;
    let delivered = 0;
    await page.route("**/api/orders", async (route) => {
      if (!reachable) {
        await route.abort("internetdisconnected");
        return;
      }
      delivered++;
      await route.continue();
    });
    await openMenu(page);
    await page.getByRole("button", { name: "Increase " + meal + " quantity" }).click();
    const before = await orderCount();
    await page.getByRole("button", { name: "Send order" }).click();
    const failed = page.getByText(
      "We couldn't send your order. Check your connection, then try again.",
    );
    await expect(failed).toBeVisible({ timeout: 15_000 });
    expect(await orderCount()).toBe(before);

    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const retry = page.getByRole("button", { name: "Try again" });
        expect((await retry.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        await retry.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: "docs/reviews/TICKET-074/" + theme.id + "/" + width + "-failed.png",
        });
      }

    reachable = true;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(
      page.getByRole("heading", { name: "On its way. Sit back, we've got this." }),
    ).toBeVisible();
    expect(delivered).toBe(1);
    expect(await orderCount()).toBe((before ?? 0) + 1);
  });

  test("an item that sold out after loading is refused clearly and taken out", async ({ page }) => {
    await openMenu(page);
    await page.getByRole("button", { name: "Increase " + meal + " quantity" }).click();
    await page.getByRole("button", { name: "Increase " + drink + " quantity" }).click();
    // Stop live updates so the page still thinks the meal is available when it sends.
    await page.route("**/api/menu/availability", (route) => route.abort());
    await db`update menu_items set is_available = false where name = ${meal}`;
    try {
      const before = await orderCount();
      await page.getByRole("button", { name: "Send order" }).click();
      await expect(
        page.getByText(
          "Sorry, something in your order has just sold out. We've taken it out for you.",
        ),
      ).toBeVisible();
      const quantity = page.getByLabel(meal + " quantity", { exact: true });
      await expect(quantity).toBeDisabled();
      await expect(quantity).toHaveAccessibleDescription("Sold out");
      await expect(page.getByLabel(drink + " quantity", { exact: true })).toHaveValue("1");
      expect(await orderCount()).toBe(before);
      await page.getByRole("button", { name: "Send order" }).click();
      await expect(
        page.getByRole("heading", { name: "On its way. Sit back, we've got this." }),
      ).toBeVisible();
      expect(await orderCount()).toBe((before ?? 0) + 1);
    } finally {
      await db`update menu_items set is_available = true where name = ${meal}`;
    }
  });
});
