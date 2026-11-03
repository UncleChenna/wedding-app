import { retireInvitationFixtures } from "./support/invitation-fixtures";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("named RSVP party", () => {
  test.skip(
    process.env.RUN_PARTY_BROWSER_TESTS !== "1",
    "Requires an explicitly enabled isolated database",
  );
  let db: Sql;
  let invitationId = "";
  let mealId = "";
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    const existing = await db`select venue from event_settings where id=1`;
    if (existing.length && existing[0]?.venue !== "RSVP browser test only")
      throw new Error("Refusing to replace event settings");
    await db`insert into event_settings(id,time_zone,venue) values(1,'Etc/UTC','RSVP browser test only') on conflict(id) do nothing`;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (invitationId) await retireInvitationFixtures(db, [invitationId]);
        if (mealId) await db`delete from menu_items where id=${mealId}`;
      } finally {
        await db.end();
      }
    }
  });
  test("add two, remove one, reload, reject tampering and review all themes", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    const token = randomBytes(32).toString("base64url");
    const [invitation] = await db<
      { id: string }[]
    >`insert into invitations(token,status,max_tag_alongs) values(${token},'sent',2) returning id`;
    if (!invitation) throw new Error("Fixture missing");
    invitationId = invitation.id;
    await db`insert into guests(invitation_id,name,is_primary) values(${invitationId},'Ada Example',true)`;
    const [meal] = await db<
      { id: string }[]
    >`insert into menu_items(name,category_v2,station) values('Jollof rice','meal','kitchen') returning id`;
    if (!meal) throw new Error("Meal fixture missing");
    mealId = meal.id;
    await page.goto("/i/" + token);
    await page.getByRole("button", { name: "Count me in", exact: true }).click();
    const section = page.locator('section[aria-labelledby="party-heading"]');
    await expect(section).toBeVisible();
    let originalPass = "";
    if (process.env.RUN_PARTY_SIGNED_PASS === "1") {
      await expect(page.locator("#pass")).toContainText("1 guest");
      originalPass =
        (await page
          .getByRole("link", { name: "Open your pass", exact: true })
          .getAttribute("href")) ?? "";
      expect(originalPass).not.toContain(token);
    }
    async function expectPassSize(size: number) {
      if (process.env.RUN_PARTY_SIGNED_PASS !== "1") return;
      await expect(page.locator("#pass")).toContainText(size + " guests");
      const passPage = await page.context().newPage();
      try {
        await passPage.goto(new URL(originalPass).pathname);
        await expect(passPage.locator("dd").filter({ hasText: size + " guests" })).toBeVisible();
        await expect(passPage.getByText("No nuts", { exact: true })).toHaveCount(0);
        await expect(passPage.getByText("Vegetarian", { exact: true })).toHaveCount(0);
      } finally {
        await passPage.close();
      }
    }
    await section.getByLabel("Meal choice").selectOption(mealId);
    await section.getByLabel("Dietary notes (optional)").fill("No nuts");
    for (const name of ["Uche Example", "Obi Example"]) {
      await section.getByRole("button", { name: "Add tag-along" }).click();
      await expect(section.getByLabel("Full name").last()).toBeFocused();
      await section.getByLabel("Full name").last().fill(name);
      await section.getByLabel("Meal choice").last().selectOption(mealId);
      await section.getByLabel("Dietary notes (optional)").last().fill("Vegetarian");
    }
    await expect(section.getByRole("button", { name: "Add tag-along" })).toBeDisabled();
    await section.getByRole("button", { name: "Save guest details" }).click();
    await expect(section.getByRole("status")).toContainText("Your guest details are saved");
    await page.reload();
    await expect(section.getByLabel("Full name")).toHaveCount(3);
    await expectPassSize(3);
    await section.getByRole("button", { name: "Remove guest: Obi Example" }).click();
    await section.getByRole("button", { name: "Save guest details" }).click();
    await expect(section.getByRole("status")).toContainText("Your guest details are saved");
    await page.reload();
    await expect(section.getByLabel("Full name")).toHaveCount(2);
    await expect(section.getByLabel("Dietary notes (optional)").first()).toHaveValue("No nuts");
    const [saved] = await db`select count_attending from rsvps where invitation_id=${invitationId}`;
    expect(saved?.count_attending).toBe(2);
    await expectPassSize(2);
    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      await page.emulateMedia({ reducedMotion });
      for (const theme of themes)
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await applyTheme(page, theme);
          await page.evaluate(() => document.fonts.ready);
          expect(await scanA11y(page)).toEqual([]);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          for (const control of await section
            .locator("input:not([type=hidden]),select,textarea,button")
            .all()) {
            const box = await control.boundingBox();
            expect(box?.height).toBeGreaterThanOrEqual(44);
            expect(box?.width).toBeGreaterThanOrEqual(44);
          }
          if (reducedMotion === "reduce" && process.env.RUN_PARTY_SIGNED_PASS !== "1") {
            const directory = "docs/reviews/TICKET-041/" + theme.id;
            mkdirSync(directory, { recursive: true });
            await section.screenshot({ path: directory + "/" + width + "-party.png" });
            await page.screenshot({
              path: directory + "/" + width + "-invitation.png",
              fullPage: true,
            });
          }
        }
    }
    await section.getByLabel("Full name").first().focus();
    await page.keyboard.press("Tab");
    await expect(section.getByLabel("Meal choice").first()).toBeFocused();
    await section.locator('input[name="people"]').evaluate((input) => {
      if (!(input instanceof HTMLInputElement)) throw new Error("Missing payload");
      const people = JSON.parse(input.value) as {
        id: string;
        name: string;
        mealChoice: string;
        dietaryNotes: string;
      }[];
      const first = people[0];
      if (!first) throw new Error("Missing person");
      input.value = JSON.stringify([
        ...people,
        { ...first, id: "", name: "Extra one" },
        { ...first, id: "", name: "Extra two" },
      ]);
    });
    await section.getByRole("button", { name: "Save guest details" }).click();
    await expect(section.getByRole("status")).toContainText("room for 2 tag-alongs");
    const [unchanged] =
      await db`select count_attending from rsvps where invitation_id=${invitationId}`;
    expect(unchanged?.count_attending).toBe(2);
    await page.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
    await expect(section).toHaveCount(0);
    await page.getByRole("button", { name: "Count me in", exact: true }).click();
    const plain = await browser.newContext({ javaScriptEnabled: false });
    try {
      const plainPage = await plain.newPage();
      await plainPage.goto(page.url());
      await expect(plainPage.getByRole("button", { name: "Save guest details" })).toBeDisabled();
      await expect(
        plainPage.getByText(/Please enable JavaScript to edit your guest details/),
      ).toBeVisible();
      await plainPage.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
      await expect(plainPage.locator('section[aria-labelledby="party-heading"]')).toHaveCount(0);
    } finally {
      await plain.close();
    }
  });
});
