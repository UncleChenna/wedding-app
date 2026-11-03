import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { invitationSiteCopy } from "../src/modules/invitations/lib/copy";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { retireInvitationFixtures } from "./support/invitation-fixtures";

test.describe("wedding-day RSVP lock", () => {
  test.skip(
    process.env.RUN_RSVP_LOCK_BROWSER_TESTS !== "1",
    "Isolated database and ephemeral signing keys required",
  );
  let db: Sql;
  const ids: string[] = [];
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [settings] = await db`select venue from event_settings where id=1`;
    if (settings && settings.venue !== "RSVP browser test only")
      throw new Error("Refusing non-test settings");
    await db`insert into event_settings(id,venue,event_date,time_zone,rsvp_lock_at) values(1,'RSVP browser test only','2099-12-19','Etc/UTC',null) on conflict(id) do update set event_date='2099-12-19',time_zone='Etc/UTC',rsvp_lock_at=null`;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        await retireInvitationFixtures(db, ids);
        await db`update event_settings set event_date='2026-12-19',time_zone='Etc/UTC',rsvp_lock_at=null where id=1 and venue='RSVP browser test only'`;
      } finally {
        await db.end();
      }
    }
  });
  test("stale submissions are rejected; locked accepted guests retain their real pass", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(120000);
    const token = randomBytes(32).toString("base64url");
    const [invitation] = await db<
      { id: string }[]
    >`insert into invitations(token,status,household_name) values(${token},'sent','Lock browser fixture') returning id`;
    if (!invitation) throw new Error("Missing fixture");
    ids.push(invitation.id);
    await db`insert into guests(invitation_id,name,is_primary) values(${invitation.id},'Ada Locked',true)`;
    const path = "/i/" + token;
    await page.goto(path);
    await page.getByRole("button", { name: "Count me in", exact: true }).click();
    await expect(page.locator("#pass")).toContainText("1 guest");
    await expect(page.locator('#pass svg[role="img"]')).toBeVisible();
    await db`update event_settings set rsvp_lock_at=${new Date(Date.now() - 1000)} where id=1`;
    await page.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
    await expect(page.getByRole("status", { name: "Your reply" })).toHaveText(
      invitationSiteCopy.editsLocked,
    );
    await expect(page.getByRole("button", { name: "Count me in", exact: true })).toHaveCount(0);
    await expect(page.locator('section[aria-labelledby="party-heading"]')).toHaveCount(0);
    const [reply] = await db`select attending from rsvps where invitation_id=${invitation.id}`;
    expect(reply?.attending).toBe(true);
    const history = await db`select id from rsvp_changes where invitation_id=${invitation.id}`;
    expect(history).toHaveLength(1);
    await page.reload();
    await expect(page.getByText(invitationSiteCopy.editsLocked, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Count me in", exact: true })).toHaveCount(0);
    await expect(page.locator('section[aria-labelledby="party-heading"]')).toHaveCount(0);
    await expect(page.locator('#pass svg[role="img"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your reply" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Your reply", exact: true })).toHaveAttribute(
      "href",
      "#reply",
    );
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const link = page.getByRole("link", { name: "Open your pass", exact: true });
        await link.focus();
        await expect(link).toBeFocused();
        const dir = "docs/reviews/TICKET-042/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/" + width + "-locked.png", fullPage: true });
      }
    const noScript = await browser.newContext({ javaScriptEnabled: false, baseURL });
    try {
      const native = await noScript.newPage();
      await native.goto(path);
      await expect(native.getByText(invitationSiteCopy.editsLocked, { exact: true })).toBeVisible();
      await expect(native.locator('#pass svg[role="img"]')).toBeVisible();
      await expect(native.getByRole("button", { name: "Count me in", exact: true })).toHaveCount(0);
    } finally {
      await noScript.close();
    }
    await db`update event_settings set time_zone=null,rsvp_lock_at=null where id=1`;
    await page.reload();
    await expect(
      page.getByText("Replies aren’t open just yet. Please check back soon.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Count me in", exact: true })).toHaveCount(0);
  });
});
