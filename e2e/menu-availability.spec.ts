import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { setOrderingOpen } from "./support/ordering-open";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("live menu availability", () => {
  test.skip(process.env.RUN_MENU_BROWSER_TESTS !== "1", "Requires isolated local menu fixtures");
  let db: Sql;
  let restoreOrdering: (() => Promise<void>) | undefined;
  let table: number;
  let tableId: string | undefined;
  const itemIds: string[] = [];
  const tag = "TICKET-071 fixture " + randomInt(100000, 900000);
  const meal = tag + " rice";
  const drink = tag + " punch";
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    // Ordering is closed by default (TICKET-080); these tests need it open.
    restoreOrdering = await setOrderingOpen(db, true);
    table = randomInt(100000, 900000);
    const [row] = await db<
      { id: string }[]
    >`insert into tables(number,name,capacity) values(${table},${tag},4) returning id`;
    tableId = row?.id;
    // Sort first so the fixtures are visible without scrolling past the seeded menu.
    for (const [name, category, station] of [
      [meal, "meal", "kitchen"],
      [drink, "soft_drink", "bar"],
    ] as const) {
      const [item] = await db<{ id: string }[]>`
        insert into menu_items(name, description, category_v2, station, sort_order, max_per_order)
        values(${name}, 'A fixture for the live sold-out test.', ${category}, ${station}, -1000, 3)
        returning id`;
      if (!item) throw new Error("Missing fixture");
      itemIds.push(item.id);
    }
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (itemIds.length) await db`delete from menu_items where id in ${db(itemIds)}`;
      if (tableId) await db`delete from tables where id = ${tableId}`;
    } finally {
      await restoreOrdering?.();
      await db.end();
    }
  });

  test("sold-out changes reach an open page within 5 seconds, in text, in every theme", async ({
    page,
  }) => {
    await page.goto("/order");
    const input = page.getByLabel("Table number", { exact: true });
    await input.fill(String(table));
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Table " + table, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What can we bring you?" })).toBeVisible();
    for (const name of ["Meals", "Soft drinks", "Alcoholic drinks"])
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();

    const mealQuantity = page.getByLabel(meal + " quantity", { exact: true });
    await expect(mealQuantity).toBeEnabled();
    await page.getByRole("button", { name: "Increase " + meal + " quantity" }).click();
    await expect(mealQuantity).toHaveValue("1");

    await db`update menu_items set is_available = false where name = ${meal}`;
    const started = Date.now();
    await expect(mealQuantity).toBeDisabled({ timeout: 5000 });
    expect(Date.now() - started).toBeLessThan(5000);
    await expect(mealQuantity).toHaveValue("0");
    await expect(mealQuantity).toHaveAccessibleDescription("Sold out");
    await expect(
      page.getByRole("status").filter({ hasText: meal + " has just sold out." }),
    ).toHaveCount(1);
    await expect(page.getByLabel(drink + " quantity", { exact: true })).toBeEnabled();

    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const dir = "docs/reviews/TICKET-071/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/" + width + "-menu.png", fullPage: false });
      }

    await db`update menu_items set is_available = true where name = ${meal}`;
    await expect(mealQuantity).toBeEnabled({ timeout: 5000 });
    await expect(
      page.getByRole("status").filter({ hasText: meal + " is available again." }),
    ).toHaveCount(1);
  });

  test("the availability endpoint is uncached and exposes only id and availability", async ({
    request,
  }) => {
    const response = await request.get("/api/menu/availability");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = (await response.json()) as { items: Record<string, unknown>[] };
    const fixture = body.items.find((item) => item.id === itemIds[0]);
    expect(fixture).toBeDefined();
    for (const item of body.items) expect(Object.keys(item).sort()).toEqual(["available", "id"]);
  });
});
