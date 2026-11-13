import { randomInt, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { setOrderingOpen } from "./support/ordering-open";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("ordering open and closed", () => {
  test.skip(process.env.RUN_ORDER_BROWSER_TESTS !== "1", "Requires isolated local order fixtures");
  let db: Sql;
  let restore: (() => Promise<void>) | undefined;
  let table: number;
  let tableId: string | undefined;
  let itemId: string | undefined;
  const tag = "TICKET-080 fixture " + randomInt(100000, 900000);

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    restore = await setOrderingOpen(db, false);
    table = randomInt(100000, 900000);
    const [row] = await db<
      { id: string }[]
    >`insert into tables(number,name,capacity) values(${table},${tag},4) returning id`;
    tableId = row?.id;
    const [item] = await db<{ id: string }[]>`
      insert into menu_items(name, category_v2, station, sort_order) values(${tag + " rice"}, 'meal', 'kitchen', -1000)
      returning id`;
    itemId = item?.id;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (tableId) await db`delete from orders where table_id = ${tableId}`;
      if (itemId) await db`delete from menu_items where id = ${itemId}`;
      if (tableId) await db`delete from tables where id = ${tableId}`;
      await restore?.();
    } finally {
      await db.end();
    }
  });

  test("the closed page opens and closes live, and the server refuses guests while closed", async ({
    page,
    request,
  }) => {
    await page.goto("/order");
    const input = page.getByLabel("Table number", { exact: true });
    await input.fill(String(table));
    await input.press("Enter");
    const closedHeading = page.getByRole("heading", { name: "The menu opens soon" });
    await expect(closedHeading).toBeVisible();
    await expect(
      page.getByText("Ordering opens after the couple's entrance.", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Send order" })).toHaveCount(0);

    // The server refuses a guest order directly, whatever the page shows.
    const refused = await request.post("/api/orders", {
      data: {
        clientRequestId: randomUUID(),
        table,
        items: [{ menuItemId: itemId, quantity: 1 }],
        note: "",
      },
    });
    expect(refused.status()).toBe(422);
    expect(await refused.json()).toEqual({ status: "rejected", reason: "closed" });

    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const dir =
          (process.env.ORDER_REVIEW_DIR
            ? process.env.ORDER_REVIEW_DIR + "/TICKET-080/"
            : "docs/reviews/TICKET-080/") + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/" + width + "-closed.png" });
      }

    await page.setViewportSize({ width: 375, height: 900 });
    await db`update event_settings set ordering_open = true where id = 1`;
    let started = Date.now();
    await expect(page.getByRole("button", { name: "Send order" })).toBeVisible({ timeout: 5000 });
    expect(Date.now() - started).toBeLessThan(5000);
    await expect(page.getByLabel(tag + " rice quantity", { exact: true })).toBeEnabled();

    await db`update event_settings set ordering_open = false where id = 1`;
    started = Date.now();
    await expect(closedHeading).toBeVisible({ timeout: 5000 });
    expect(Date.now() - started).toBeLessThan(5000);
  });
});
