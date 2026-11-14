import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "./fixtures";
import { assertDatabaseTarget } from "../scripts/database-target";
import { invitationSiteCopy } from "../src/modules/invitations/lib/copy";
import { retireInvitationFixtures } from "./support/invitation-fixtures";

const venue = "TICKET-131 synthetic journey only";
test.describe("real invitation journey", () => {
  test.skip(
    process.env.RUN_GUEST_JOURNEY !== "1",
    "Run with scripts/test-guest-journey.ts on an isolated database",
  );
  let db: Sql;
  let invitationId = "";
  let mealId = "";
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [settings] = await db`select venue from event_settings where id=1`;
    if (settings && settings.venue !== venue)
      throw new Error("Refusing non-journey event settings");
    await db`insert into event_settings(id,venue,event_date,time_zone,rsvp_lock_at) values(1,${venue},'2099-12-19','Etc/UTC',null)
      on conflict(id) do update set event_date='2099-12-19',time_zone='Etc/UTC',rsvp_lock_at=null`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (invitationId) await retireInvitationFixtures(db, [invitationId]);
      if (mealId) await db`delete from menu_items where id=${mealId}`;
      await db`delete from event_settings where id=1 and venue=${venue}`;
    } finally {
      await db.end();
    }
  });
  test("open, accept, add companion, save pass, return, edit and lock", async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);
    const token = randomBytes(32).toString("base64url");
    const [invitation] = await db<
      { id: string }[]
    >`insert into invitations(token,status,household_name,max_tag_alongs)
      values(${token},'sent','Synthetic journey household',1) returning id`;
    if (!invitation) throw new Error("Missing invitation fixture");
    invitationId = invitation.id;
    await db`insert into guests(invitation_id,name,is_primary) values(${invitationId},'Amara Journey',true)`;
    const [meal] = await db<
      { id: string }[]
    >`insert into menu_items(name,category_v2,station) values('Journey meal','meal','kitchen') returning id`;
    if (!meal) throw new Error("Missing meal fixture");
    mealId = meal.id;
    const path = "/i/" + token;
    await page.goto(path);
    await expect(page.getByText(venue, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Count me in", exact: true }).click();
    const party = page.locator('section[aria-labelledby="party-heading"]');
    await expect(party).toBeVisible();
    await party.getByLabel("Meal choice").selectOption(mealId);
    await party.getByRole("button", { name: "Add tag-along", exact: true }).click();
    await party.getByLabel("Full name").last().fill("Obi Journey");
    await party.getByLabel("Meal choice").last().selectOption(mealId);
    await party.getByRole("button", { name: "Save guest details", exact: true }).click();
    await expect(party.getByRole("status")).toContainText("Your guest details are saved");
    await expect(page.locator("#pass")).toContainText("2 guests");
    await expect(page.locator('#pass svg[role="img"]')).toBeVisible();
    const passUrl = await page
      .getByRole("link", { name: "Open your pass", exact: true })
      .getAttribute("href");
    expect(passUrl).toBeTruthy();
    if (!passUrl) throw new Error("Missing signed pass URL");
    expect(passUrl).not.toContain(token);
    const passPath = new URL(passUrl).pathname;
    const passPage = await context.newPage();
    try {
      await passPage.goto(passPath);
      await expect(passPage.getByRole("heading", { name: "Amara Journey" })).toBeVisible();
      await expect(passPage.getByText("2 guests", { exact: true })).toBeVisible();
      await expect(passPage.getByRole("button", { name: "Count me in", exact: true })).toHaveCount(
        0,
      );
    } finally {
      await passPage.close();
    }
    const imagePending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save image", exact: true }).click();
    const image = await imagePending;
    expect(image.suggestedFilename()).toBe("entry-pass.png");
    expect(await image.failure()).toBeNull();
    const pdfPending = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download invitation PDF", exact: true }).click();
    const pdf = await pdfPending;
    expect(pdf.suggestedFilename()).toBe("wedding-invitation.pdf");
    expect(await pdf.failure()).toBeNull();
    await page.goto("/");
    await page.goto(path);
    await expect(party.getByLabel("Full name").last()).toHaveValue("Obi Journey");
    await expect(party.getByLabel("Meal choice").last()).toHaveValue(mealId);
    await party.getByLabel("Full name").last().fill("Obi Updated");
    await party.getByRole("button", { name: "Save guest details", exact: true }).click();
    await expect(party.getByRole("status")).toContainText("Your guest details are saved");
    await page.reload();
    await expect(party.getByLabel("Full name").last()).toHaveValue("Obi Updated");
    const before =
      await db`select to_jsonb(r) as row from rsvps r where invitation_id=${invitationId}`;
    const historyBefore = await db`select id from rsvp_changes where invitation_id=${invitationId}`;
    expect(historyBefore.length).toBeGreaterThanOrEqual(3);
    // Lock while the browser still holds an editable form, testing the server-side race guard.
    await db`update event_settings set rsvp_lock_at=${new Date(Date.now() - 1000)} where id=1 and venue=${venue}`;
    await page.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
    await expect(page.getByRole("status", { name: "Your reply" })).toHaveText(
      invitationSiteCopy.editsLocked,
    );
    await page.reload();
    await expect(page.getByText(invitationSiteCopy.editsLocked, { exact: true })).toBeVisible();
    await expect(party).toHaveCount(0);
    await expect(page.locator('#pass svg[role="img"]')).toBeVisible();
    expect(
      await db`select to_jsonb(r) as row from rsvps r where invitation_id=${invitationId}`,
    ).toEqual(before);
    expect(await db`select id from rsvp_changes where invitation_id=${invitationId}`).toHaveLength(
      historyBefore.length,
    );
    await page.goto(passPath);
    await expect(page.getByText("2 guests", { exact: true })).toBeVisible();
  });
});
