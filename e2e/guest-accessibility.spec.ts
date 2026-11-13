import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { retireInvitationFixtures } from "./support/invitation-fixtures";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

const venue = "TICKET-117 synthetic accessibility audit";
let db: Sql;
let mealId = "";
const ids: string[] = [];
test.describe("guest accessibility audit", () => {
  test.skip(process.env.RUN_GUEST_ACCESSIBILITY !== "1", "Owned isolated audit database required");
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [settings] = await db`select venue from event_settings where id=1`;
    if (settings) throw new Error("Audit requires empty isolated event settings");
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    const [meal] = await db<
      { id: string }[]
    >`insert into menu_items(name,category_v2,station) values('Vegetable rice','meal','kitchen') returning id`;
    if (!meal) throw new Error("Meal fixture missing");
    mealId = meal.id;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await retireInvitationFixtures(db, ids);
      if (mealId) await db`delete from menu_items where id=${mealId}`;
      await db`delete from event_settings where id=1 and venue=${venue}`;
    } finally {
      await db.end();
    }
  });
  for (const theme of themes)
    for (const width of [320, 375, 768, 1280]) {
      test(`${theme.id} ${width}: invitation, saved RSVP and pass`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        const token = randomBytes(32).toString("base64url");
        const [row] = await db<
          { id: string }[]
        >`insert into invitations(token,status,household_name,max_tag_alongs) values(${token},'sent','Accessibility sample household',1) returning id`;
        if (!row) throw new Error("Invitation fixture missing");
        ids.push(row.id);
        await db`insert into guests(invitation_id,name,is_primary) values(${row.id},'Ada Sample',true)`;
        const directory = `docs/reviews/TICKET-117/${theme.id}/${width}`;
        mkdirSync(directory, { recursive: true });
        const results: {
          state: string;
          violations: string[];
          overflow: boolean;
          textScale: number;
        }[] = [];
        async function audit(state: string, textScale = 1) {
          await applyTheme(page, theme);
          await page.evaluate((scale) => {
            document.documentElement.style.fontSize = `${100 * scale}%`;
          }, textScale);
          await page.evaluate(() => document.fonts.ready);
          const violations = await scanA11y(page);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          results.push({ state, violations, overflow, textScale });
          await page.screenshot({ path: `${directory}/${state}.png`, fullPage: true });
          writeFileSync(`${directory}/results.json`, JSON.stringify(results, null, 2) + "\n");
          expect.soft(violations, state).toEqual([]);
          expect.soft(overflow, state).toBe(false);
        }
        await page.goto(`/i/${token}`);
        await audit("invitation");
        const yes = page.getByRole("button", { name: "Count me in", exact: true });
        let reached = false;
        for (let tabs = 0; tabs < 40; tabs++) {
          await page.keyboard.press("Tab");
          if (await yes.evaluate((element) => element === document.activeElement)) {
            reached = true;
            break;
          }
        }
        expect(reached, "RSVP reachable by sequential keyboard navigation").toBe(true);
        await page.keyboard.press("Enter");
        await expect(page.getByRole("status", { name: "Your reply" })).toBeFocused();
        const party = page.locator('section[aria-labelledby="party-heading"]');
        await expect(party.getByLabel("Full name")).toBeVisible();
        await party.getByLabel("Meal choice").selectOption(mealId);
        await party.getByRole("button", { name: "Save guest details", exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(party.getByRole("status")).toBeFocused();
        await audit("saved-rsvp");
        await audit("saved-rsvp-text-200", 2);
        const href = await page
          .getByRole("link", { name: "Open your pass", exact: true })
          .getAttribute("href");
        if (!href) throw new Error("Issued pass missing");
        await page.goto(new URL(href, page.url()).pathname);
        await expect(page.getByRole("heading", { name: "Ada Sample", exact: true })).toBeVisible();
        await audit("issued-pass");
        await audit("issued-pass-text-200", 2);
      });
    }
});
