import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page, type APIRequestContext } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { localAdminLogin } from "./support/local-admin-login";
import { totp } from "./support/totp";

/** Signs in through the real email-code and TOTP flow on this worktree's local Auth. */
async function signInAdmin(page: Page, request: APIRequestContext, email: string) {
  await localAdminLogin(page, request, email);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  const secret = (await page.getByTestId("setup-key").textContent()) ?? "";
  await page.getByLabel("Authenticator code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("admin menu editor", () => {
  test.skip(
    process.env.RUN_ADMIN_MENU_TESTS !== "1",
    "Requires this worktree's local Auth and database, and ADMIN_EMAIL_ALLOWLIST including the test address",
  );
  test.setTimeout(300_000);
  let db: Sql;
  let table: number;
  let tableId: string | undefined;
  const tag = "TICKET-095 fixture " + randomInt(100000, 900000);
  const created: string[] = [];

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
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from menu_items where name like ${tag + "%"}`;
      if (tableId) await db`delete from tables where id = ${tableId}`;
    } finally {
      await db.end();
    }
  });

  test("add an item, toggle it sold out, and an open order page follows within 5 seconds", async ({
    page,
    request,
    browser,
    baseURL,
  }, info) => {
    // Each run needs an address that has not enrolled TOTP yet; pass one with ADMIN_MENU_TEST_EMAIL.
    await signInAdmin(
      page,
      request,
      process.env.ADMIN_MENU_TEST_EMAIL ?? `menu-${info.project.name}@example.test`,
    );
    await page
      .getByRole("navigation", { name: "Admin" })
      .getByRole("link", { name: "Menu" })
      .click();
    await expect(page.getByRole("heading", { name: "Menu", level: 1 })).toBeVisible();

    // Validation: no station, no item.
    const add = page.getByRole("region", { name: "Add an item" });
    const name = tag + " rice";
    await add.getByLabel("Name").fill(name);
    await add.getByLabel("Category").selectOption("meal");
    await add.getByLabel("Position").fill("-1000");
    await add.getByRole("button", { name: "Add an item" }).click();
    await expect(add.getByText("Choose the kitchen or the bar.")).toBeVisible();
    await expect(add.getByLabel("Prepared by")).toBeFocused();
    // A refused form keeps what the admin typed.
    await expect(add.getByLabel("Name")).toHaveValue(name);
    await expect(add.getByLabel("Category")).toHaveValue("meal");
    await expect(add.getByLabel("Position")).toHaveValue("-1000");
    expect((await db`select 1 from menu_items where name = ${name}`).length).toBe(0);

    await add.getByLabel("Prepared by").selectOption("kitchen");
    await add.getByLabel("Most per order").fill("3");
    await add.getByRole("button", { name: "Add an item" }).click();
    await expect(add.getByRole("status")).toHaveText("Added to the menu.");
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
    created.push(name);

    // A guest has the order page open for a table.
    const guestContext = await browser.newContext({ baseURL });
    try {
      const guest = await guestContext.newPage();
      await guest.goto("/order");
      await guest.getByLabel("Table number", { exact: true }).fill(String(table));
      await guest.getByLabel("Table number", { exact: true }).press("Enter");
      const quantity = guest.getByLabel(name + " quantity", { exact: true });
      await expect(quantity).toBeEnabled();

      await page.getByRole("button", { name: "Mark sold out: " + name }).click();
      await expect(page.getByRole("button", { name: "Mark available: " + name })).toBeVisible();
      const started = Date.now();
      await expect(quantity).toBeDisabled({ timeout: 5000 });
      expect(Date.now() - started).toBeLessThan(5000);
      await expect(quantity).toHaveAccessibleDescription("Sold out");

      await page.getByRole("button", { name: "Mark available: " + name }).click();
      await expect(quantity).toBeEnabled({ timeout: 5000 });
    } finally {
      await guestContext.close();
    }

    // Edit forms sit in closed <details>, where colour transitions never run or finish; switch
    // transitions off so the animation settling in applyTheme and scanA11y can complete.
    await page.addStyleTag({
      content:
        "*, *::before, *::after { transition: none !important; animation: none !important; }",
    });
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        // One full scan per theme (contrast is per theme); the editor page is large and axe is slow.
        if (width === 375) expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const dir = "docs/reviews/TICKET-095/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.getByRole("heading", { name, level: 3 }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: dir + "/" + width + "-menu.png" });
      }

    // An item already ordered stays on record; removing a fresh one works.
    await page.getByRole("button", { name: "Remove item: " + name }).click();
    await expect(page.getByRole("heading", { name, level: 3 })).toHaveCount(0);
    expect((await db`select 1 from menu_items where name = ${name}`).length).toBe(0);
  });
});
