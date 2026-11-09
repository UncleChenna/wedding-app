import { createPrivateKey, randomBytes, randomInt, randomUUID, sign } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

test.describe("seating admin", () => {
  test.skip(process.env.RUN_SEATING_E2E !== "1", "Isolated Auth and synthetic fixtures required");
  test.setTimeout(240_000);
  let db: Sql;
  const id = randomUUID();
  const tag = `Seating household ${randomUUID().slice(0, 8)}`;
  const first = randomInt(100000, 500000);
  const second = first + 1;
  const renamed = first + 2;
  let pass = "";
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    await db`insert into invitations(id,token,household_name,status) values (${id},${randomBytes(32).toString("base64url")},${tag},'rsvp_yes')`;
    await db`insert into guests(invitation_id,name,is_primary) values (${id},'Ada Seating',true),(${id},'Uchenna Seating',false)`;
    await db`insert into rsvps(invitation_id,attending,count_attending) values (${id},true,2)`;
    const payload = Buffer.from(
      JSON.stringify({
        v: 1,
        kid: "seating-test",
        inv: id,
        ver: 1,
        iat: Math.floor(Date.now() / 1000),
      }),
    ).toString("base64url");
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      format: "der",
      type: "pkcs8",
    });
    pass = `${payload}.${sign(null, Buffer.from(payload), key).toString("base64url")}`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from invitations where id = ${id}`;
      await db`delete from tables where name = ${tag}`;
    } finally {
      await db.end();
    }
  });
  test("creates tables, assigns with keyboard, warns, renumbers and keeps the live pass current", async ({
    page,
    request,
    context,
  }, info) => {
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/admin/guests/seating");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await signInAdmin(
      page,
      request,
      `${process.env.SEATING_TEST_PREFIX}-${info.project.name}@example.test`,
    );
    await page.getByRole("link", { name: "Seating", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Seating plan", exact: true })).toBeVisible();
    await page.addInitScript(() => {
      const state = window as unknown as { seatingCls: number };
      state.seatingCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) state.seatingCls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.reload();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    expect(
      await page.evaluate(() => (window as unknown as { seatingCls: number }).seatingCls),
    ).toBe(0);
    for (const number of [first, second]) {
      await page.getByRole("button", { name: "Add table", exact: true }).click();
      await page.getByLabel("Table number", { exact: true }).fill(String(number));
      await page.getByLabel("Table name", { exact: true }).fill(tag);
      await page.getByLabel("Seats", { exact: true }).fill(number === first ? "1" : "4");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Add table", exact: true })
        .click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
    await page.getByLabel("Find a household").fill(tag);
    const assign = page.getByRole("button", { name: `Assign table for ${tag}`, exact: true });
    await assign.focus();
    await page.keyboard.press("Enter");
    await page
      .getByLabel("Table", { exact: true })
      .selectOption({ label: `Table ${first} · ${tag}` });
    await expect(page.getByRole("dialog").getByRole("status")).toContainText("1 over capacity");
    const save = page.getByRole("button", { name: "Save assignment" });
    let releaseSave: () => void = () => {};
    let sawSave: () => void = () => {};
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    const saveStarted = new Promise<void>((resolve) => {
      sawSave = resolve;
    });
    await page.route("**/admin/guests/seating", async (route) => {
      if (route.request().method() === "POST") {
        sawSave();
        await saveGate;
      }
      await route.continue();
    });
    await save.focus();
    await page.keyboard.press("Enter");
    await saveStarted;
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeVisible();
    releaseSave();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Household assigned" })).toBeFocused();
    await page.unrouteAll({ behavior: "wait" });
    const guest = await context.newPage();
    await guest.goto(`/p/${pass}`);
    await expect(guest.locator("dd").getByText(String(first), { exact: true })).toBeVisible();
    const folder = `docs/reviews/TICKET-093/screenshots/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page
          .locator(
            "main button, main input, main select, main label, dialog button, dialog input, dialog select, dialog label",
          )
          .evaluateAll((elements) =>
            elements
              .filter((element) => {
                const box = element.getBoundingClientRect();
                return (
                  box.width > 0 &&
                  box.height > 0 &&
                  Number.parseFloat(getComputedStyle(element).fontSize) < 18
                );
              })
              .map((element) => element.textContent),
          ),
      ).toEqual([]);
      await page.screenshot({ path: `${folder}/${theme.id}-seating.png`, fullPage: true });
      await assign.click();
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page
          .locator(
            "main button, main input, main select, main label, dialog button, dialog input, dialog select, dialog label",
          )
          .evaluateAll((elements) =>
            elements
              .filter((element) => {
                const box = element.getBoundingClientRect();
                return (
                  box.width > 0 &&
                  box.height > 0 &&
                  Number.parseFloat(getComputedStyle(element).fontSize) < 18
                );
              })
              .map((element) => element.textContent),
          ),
      ).toEqual([]);
      await page.screenshot({ path: `${folder}/${theme.id}-assignment.png`, fullPage: true });
      await page.keyboard.press("Escape");
      await expect(assign).toBeFocused();
    }
    await assign.click();
    await page
      .getByLabel("Table", { exact: true })
      .selectOption({ label: `Table ${second} · ${tag}` });
    await page.getByRole("button", { name: "Save assignment" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await guest.reload();
    await expect(guest.locator("dd").getByText(String(second), { exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Edit table ${second}`, exact: true }).click();
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page
          .locator(
            "main button, main input, main select, main label, dialog button, dialog input, dialog select, dialog label",
          )
          .evaluateAll((elements) =>
            elements
              .filter((element) => {
                const box = element.getBoundingClientRect();
                return (
                  box.width > 0 &&
                  box.height > 0 &&
                  Number.parseFloat(getComputedStyle(element).fontSize) < 18
                );
              })
              .map((element) => element.textContent),
          ),
      ).toEqual([]);
      await page.screenshot({ path: `${folder}/${theme.id}-edit.png`, fullPage: true });
    }
    await page.getByLabel("Table number", { exact: true }).fill(String(renamed));
    await page.getByRole("button", { name: "Save table", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await guest.reload();
    await expect(guest.locator("dd").getByText(String(renamed), { exact: true })).toBeVisible();
    await assign.click();
    await page.getByLabel("Table", { exact: true }).selectOption("");
    await page.getByRole("button", { name: "Save assignment" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await guest.reload();
    await expect(guest.locator("dd").getByText("To follow", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Edit table ${first}`, exact: true }).click();
    await page.getByRole("button", { name: "Delete table", exact: true }).click();
    await expect(page.getByRole("button", { name: "Confirm delete", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Keep table", exact: true }).click();
    await expect(page.getByRole("button", { name: "Delete table", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Confirm delete", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Table deleted" })).toBeFocused();
    await expect(
      page.getByRole("button", { name: `Edit table ${first}`, exact: true }),
    ).toHaveCount(0);
    for (const width of [375, 600, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page.locator("main button, main input, main select, main a").evaluateAll((elements) =>
          elements
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
            })
            .map((element) => element.textContent),
        ),
      ).toEqual([]);
    }
    await guest.close();
  });
});
