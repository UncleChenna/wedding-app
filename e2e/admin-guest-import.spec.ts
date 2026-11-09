import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

test.describe("guest CSV upload", () => {
  test.skip(
    process.env.RUN_GUEST_IMPORT_TESTS !== "1",
    "Requires merged import service and isolated Auth/database",
  );
  test.setTimeout(240_000);
  let db: Sql;
  const existingId = randomUUID();
  const tag = `CSV-${randomUUID().slice(0, 8)}`;
  const existingName = `${tag} Existing`;
  const existingEmail = `${tag.toLowerCase()}-existing@example.test`;
  const header = "name,phone,email,party size,side,table,household\r\n";
  const csv = (count: number, invalid = false) =>
    header +
    Array.from(
      { length: count },
      (_, index) =>
        `${tag} Guest ${index},,${invalid && index === 149 ? "invalid-email" : `${tag.toLowerCase()}-${index}@example.test`},1,Family,,`,
    ).join("\r\n");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    await db`insert into invitations(id,token,household_name,status) values (${existingId},${randomBytes(32).toString("base64url")},${existingName},'rsvp_yes')`;
    await db`insert into guests(invitation_id,name,email,is_primary) values (${existingId},${existingName},${existingEmail},true)`;
    await db`insert into rsvps(invitation_id,attending,count_attending,responded_at) values (${existingId},true,1,'2026-11-01T12:00:00Z')`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from guest_import_batches where actor_id in (select id from auth.users where email = ${`${process.env.IMPORT_TEST_PREFIX}-mobile@example.test`} or email = ${`${process.env.IMPORT_TEST_PREFIX}-desktop@example.test`})`;
      await db`delete from invitations where household_name like ${`${tag}%`}`;
    } finally {
      await db.end();
    }
  });
  test("validates before writes, imports 300 guests once and preserves existing replies", async ({
    page,
    request,
  }, info) => {
    const email = `${process.env.IMPORT_TEST_PREFIX}-${info.project.name}@example.test`;
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/admin/guests/import");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await signInAdmin(page, request, email);
    await page.goto("/admin/guests");
    await page.getByRole("link", { name: "Import guests", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Import guests", exact: true })).toBeVisible();
    await page.addInitScript(() => {
      const state = window as unknown as { importCls: number };
      state.importCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) state.importCls += shift.value;
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
    expect(await page.evaluate(() => (window as unknown as { importCls: number }).importCls)).toBe(
      0,
    );
    const upload = async (text: string) => {
      await expect(page.getByLabel("Guest CSV file")).toBeEnabled();
      await page
        .getByLabel("Guest CSV file")
        .setInputFiles({ name: "guests.csv", mimeType: "text/csv", buffer: Buffer.from(text) });
      await page.getByRole("button", { name: "Preview guests", exact: true }).click();
    };
    const count = async () =>
      (
        await db<
          { count: number }[]
        >`select count(*)::int as count from invitations where household_name like ${`${tag}%`}`
      )[0]?.count;
    await upload(csv(300, true));
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Row 151");
    expect(await count()).toBe(1);
    await expect(page.getByRole("button", { name: "Import guests", exact: true })).toHaveCount(0);
    const folder = `docs/reviews/TICKET-091/screenshots/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page.locator("main button, main input, main label").evaluateAll((elements) =>
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
      await page.screenshot({ path: `${folder}/${theme.id}-errors.png`, fullPage: true });
    }
    await upload(header + `${tag} Conflict,,${existingEmail},1,Family,,`);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("contact already exists");
    expect(await count()).toBe(1);
    await upload(csv(2));
    await expect(page.getByRole("heading", { name: "Review your invitations" })).toBeFocused();
    expect(await count()).toBe(1);
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page.locator("main button, main input, main label").evaluateAll((elements) =>
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
      await page.screenshot({ path: `${folder}/${theme.id}-preview.png`, fullPage: true });
    }
    await upload(csv(300));
    await expect(
      page.getByText(
        "300 named guests across 300 invitations. Nothing is added until you choose Import guests.",
      ),
    ).toBeVisible();
    expect(await count()).toBe(1);
    const commit = page.getByRole("button", { name: "Import guests", exact: true });
    await expect(commit).toBeEnabled();
    await commit.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("300 draft invitations added.")).toBeVisible();
    await expect(page.getByRole("main").getByRole("status")).toBeFocused();
    expect(await count()).toBe(301);
    expect(await db`select status from invitations where id = ${existingId}`).toEqual([
      { status: "rsvp_yes" },
    ]);
    expect(
      await db`select count_attending,responded_at::text as responded_at from rsvps where invitation_id = ${existingId}`,
    ).toEqual([{ count_attending: 1, responded_at: "2026-11-01 12:00:00+00" }]);
    await upload(csv(300));
    await expect(commit).toBeEnabled();
    await commit.click();
    await expect(
      page.getByText("This import was already completed. No duplicate invitations were added."),
    ).toBeVisible();
    expect(await count()).toBe(301);
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(
        await page.locator("main button, main input, main label").evaluateAll((elements) =>
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
      await page.screenshot({ path: `${folder}/${theme.id}-success.png`, fullPage: true });
    }
    for (const width of [375, 600, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page.locator("main button, main input, main a").evaluateAll((elements) =>
          elements
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
            })
            .map((element) => element.textContent),
        ),
      ).toEqual([]);
    }
  });
});
