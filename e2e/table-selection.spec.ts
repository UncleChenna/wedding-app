import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { TABLE_COOKIE } from "../src/modules/ordering/lib/table-selection";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("real table selection", () => {
  test.skip(process.env.RUN_TABLE_BROWSER_TESTS !== "1", "Requires isolated local table fixtures");
  let db: Sql;
  const ids: string[] = [];
  let first: number;
  let second: number;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    first = randomInt(100000, 900000);
    second = first + 1;
    for (const number of [first, second]) {
      const [row] = await db<
        { id: string }[]
      >`insert into tables(number,name,capacity) values(${number},'TICKET-070 browser fixture',4) returning id`;
      if (!row) throw new Error("Missing fixture");
      ids.push(row.id);
    }
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (ids.length) await db`delete from tables where id in ${db(ids)}`;
      } finally {
        await db.end();
      }
    }
  });
  test("anonymous entry, errors, reload, change, stale cookie and theme states", async ({
    page,
    context,
    browser,
    baseURL,
  }) => {
    const response = await page.goto("/order");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(
      page.getByRole("heading", { name: "Hungry? Thirsty? Say the word.", exact: true }),
    ).toBeVisible();
    const input = page.getByLabel("Table number", { exact: true });
    await expect(input).toHaveAttribute("inputmode", "numeric");
    await page.getByRole("button", { name: "Confirm table" }).click();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toBeFocused();
    await expect(
      page.getByText("Enter the number on your table card.", { exact: true }),
    ).toBeVisible();
    await input.fill("2147483647");
    await input.press("Enter");
    await expect(page.getByText("That table isn't on our list.", { exact: false })).toBeVisible();
    expect((await context.cookies()).some((c) => c.name === TABLE_COOKIE)).toBe(false);
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        await input.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect((await input.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        expect(
          await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
        ).toBeGreaterThanOrEqual(24);
        const dir =
          (process.env.ORDER_REVIEW_DIR
            ? process.env.ORDER_REVIEW_DIR + "/TICKET-070/"
            : "docs/reviews/TICKET-070/") + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/" + width + "-error.png", fullPage: true });
      }
    await input.fill(String(first));
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Table " + first, exact: true })).toBeVisible();
    const cookie = (await context.cookies()).find((c) => c.name === TABLE_COOKIE);
    expect(cookie).toMatchObject({
      value: String(first),
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/order",
      expires: -1,
    });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Table " + first, exact: true })).toBeVisible();
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({
          path:
            (process.env.ORDER_REVIEW_DIR
              ? process.env.ORDER_REVIEW_DIR + "/TICKET-070/"
              : "docs/reviews/TICKET-070/") +
            theme.id +
            "/" +
            width +
            "-selected.png",
          fullPage: true,
        });
      }
    await page.getByRole("link", { name: "Change table", exact: true }).click();
    await expect(input).toHaveValue(String(first));
    await input.fill(String(second));
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Table " + second, exact: true })).toBeVisible();
    const fresh = await browser.newContext({ baseURL });
    try {
      const other = await fresh.newPage();
      await other.goto("/order");
      await expect(other.getByLabel("Table number", { exact: true })).toBeVisible();
      await expect(
        other.getByRole("heading", { name: "Table " + second, exact: true }),
      ).toHaveCount(0);
    } finally {
      await fresh.close();
    }
    await db`delete from tables where number=${second} and name='TICKET-070 browser fixture'`;
    await page.reload();
    await expect(page.getByText("That table isn't on our list.", { exact: false })).toBeVisible();
    await context.addCookies([
      {
        name: TABLE_COOKIE,
        value: "not-a-table",
        domain: "localhost",
        path: "/order",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.reload();
    await expect(
      page.getByText("Enter the number on your table card.", { exact: true }),
    ).toBeVisible();
    await input.fill(String(first));
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Table " + first, exact: true })).toBeVisible();
  });
  test("native form works with JavaScript disabled", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto("/order");
      await page.getByLabel("Table number", { exact: true }).fill("0");
      await page.getByRole("button", { name: "Confirm table" }).click();
      await expect(
        page.getByText("Enter the number on your table card.", { exact: true }),
      ).toBeVisible();
      await page.getByLabel("Table number", { exact: true }).fill(String(first));
      await page.getByRole("button", { name: "Confirm table" }).click();
      await expect(
        page.getByRole("heading", { name: "Table " + first, exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Table " + first, exact: true }),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });
});
