import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import postgres, { type Sql } from "postgres";
import { assertDatabaseTarget } from "../scripts/database-target";
import { listThemes } from "../src/modules/theming";
import { invitationSiteCopy } from "../src/modules/invitations/lib/copy";
import { applyTheme } from "./support/theme";
import { settleAnimations } from "./support/axe";

let db: Sql;
const ids: string[] = [];
test.describe("saved RSVP visual review", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(process.env.RUN_RSVP_REVIEW !== "1", "Requires the isolated RSVP review database");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    const [settings] = await db`select venue from event_settings where id=1`;
    if (settings?.venue !== "RSVP browser test only")
      throw new Error("Run RSVP live fixture first; never overwrite real settings");
    await db`update event_settings set time_zone='Etc/UTC' where id=1`;
  });
  test.afterAll(async () => {
    if (db) {
      await db`update event_settings set time_zone='Etc/UTC' where id=1 and venue='RSVP browser test only'`;
      if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
      await db.end();
    }
  });

  async function capture(page: Page, path: string) {
    await settleAnimations(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    const targets = await page.locator("button, a").evaluateAll((elements) =>
      elements.map((el) => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height };
      }),
    );
    expect(targets.every((r) => r.width >= 44 && r.height >= 44)).toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path, fullPage: true });
  }

  for (const theme of listThemes())
    for (const width of [375, 768, 1280]) {
      test(`${theme.id} ${width}: initial, yes, no, error and closed`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        const token = randomBytes(32).toString("base64url");
        const [row] = await db<
          { id: string }[]
        >`insert into invitations(token,household_name,status) values(${token},'Sample RSVP household','sent') returning id`;
        if (!row) throw new Error("Missing fixture");
        ids.push(row.id);
        await db`insert into guests(invitation_id,name,is_primary) values(${row.id},'Amara Testguest',true)`;
        const dir = `${process.env.RSVP_REVIEW_DIR ?? "docs/reviews/TICKET-040/screenshots"}/${theme.id}/${width}`;
        mkdirSync(dir, { recursive: true });
        await page.goto(`/i/${token}`);
        await applyTheme(page, theme);
        await capture(page, `${dir}/initial.png`);
        const yes = page.getByRole("button", {
          name: invitationSiteCopy.attendance.yes,
          exact: true,
        });
        await page.getByRole("link", { name: "Kindly reply" }).focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("#reply")).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(yes).toBeFocused();
        await page.keyboard.press("Enter");
        const status = page.getByRole("status", { name: "Your reply" });
        await expect(status).toHaveText(invitationSiteCopy.confirmed);
        await expect(page.getByRole("heading", { name: "Your pass", exact: true })).toBeVisible();
        await expect(
          page.getByText("Your pass will be available here", { exact: false }),
        ).toBeVisible();
        await expect(status).toBeFocused();
        await capture(page, `${dir}/yes.png`);
        await page
          .getByRole("button", { name: invitationSiteCopy.attendance.no, exact: true })
          .click();
        await expect(status).toHaveText(invitationSiteCopy.declined);
        await expect(
          page.getByRole("heading", { name: "We’ll miss you", exact: true }),
        ).toBeVisible();
        await expect(page.getByRole("heading", { name: "Your pass", exact: true })).toHaveCount(0);
        await capture(page, `${dir}/no.png`);
        await page.locator('input[name="token"]').evaluate((el) => {
          (el as HTMLInputElement).value = "invalid";
        });
        await yes.click();
        await expect(status).toContainText("try again");
        await expect(status).toBeFocused();
        await capture(page, `${dir}/error.png`);
        try {
          await db`update event_settings set time_zone=null where id=1`;
          await page.reload();
          await applyTheme(page, theme);
          await expect(
            page.getByText("Replies aren’t open just yet. Please check back soon."),
          ).toBeVisible();
          await expect(yes).toHaveCount(0);
          await capture(page, `${dir}/closed.png`);
        } finally {
          await db`update event_settings set time_zone='Etc/UTC' where id=1`;
        }
      });
    }
});
