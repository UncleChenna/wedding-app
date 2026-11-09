import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
test.describe("authenticated invitation editor", () => {
  test.skip(
    process.env.RUN_INVITATION_EDITOR_TESTS !== "1",
    "Requires synthetic isolated Auth/database fixtures",
  );
  test.setTimeout(180_000);
  let db: Sql;
  const tag = `Editor ${randomUUID()}`;
  const ids: string[] = [];
  test.beforeAll(() => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      const created = await db<
        { id: string }[]
      >`select id from invitations where household_name=${tag} or household_name=${tag + " corrected"}`;
      for (const row of created) if (!ids.includes(row.id)) ids.push(row.id);
      const retained = await db<
        { invitation_id: string }[]
      >`select invitation_id from rsvp_changes where invitation_id=any(${ids}::uuid[]) union select invitation_id from invitation_lifecycle_events where invitation_id=any(${ids}::uuid[])`;
      const audited = new Set(retained.map((row) => row.invitation_id));
      const removable = ids.filter((id) => !audited.has(id));
      if (removable.length) await db`delete from invitations where id=any(${removable}::uuid[])`;
      for (const id of audited) await db`update invitations set status='revoked' where id=${id}`;
    } finally {
      await db.end();
    }
  });
  test("validates, creates, edits and safely removes or revokes households", async ({
    page,
    request,
  }, info) => {
    const prefix = process.env.INVITATION_EDITOR_PREFIX;
    if (!prefix) throw new Error("Use scripts/test-invitation-editor.ts");
    await signInAdmin(page, request, `${prefix}-${info.project.name}@example.test`);
    if (info.project.name === "mobile") await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/admin/guests");
    await page.getByRole("link", { name: "Add an invitation", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Add an invitation", exact: true }),
    ).toBeVisible();
    await page.getByLabel("Household name", { exact: true }).fill(tag);
    await page.getByLabel("Guest 1 name", { exact: true }).fill("Synthetic primary");
    await page.getByLabel("Guest 1 email", { exact: true }).fill("bad email");
    await page.getByLabel("Guest 1 phone", { exact: true }).fill("bad phone");
    await page.getByRole("button", { name: "Create draft invitation", exact: true }).click();
    await expect(page.getByLabel("Guest 1 email", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("Guest 1 phone", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByLabel("Guest 1 email", { exact: true })).toBeFocused();
    mkdirSync("docs/reviews/TICKET-090/screenshots", { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      await page.screenshot({
        path: `docs/reviews/TICKET-090/screenshots/${info.project.name}-${theme.id}-errors.png`,
        fullPage: true,
      });
    }
    await page.getByLabel("Guest 1 email", { exact: true }).fill("synthetic@example.invalid");
    await page.getByLabel("Guest 1 phone", { exact: true }).fill("07700900123");
    await page.getByRole("button", { name: "Create draft invitation", exact: true }).click();
    await expect(page.locator("main").getByRole("status")).toContainText(
      "Draft invitation created",
    );
    await expect(page.locator("main").getByRole("status")).toBeFocused();
    const [created] = await db<
      { id: string; token: string; status: string; token_version: number }[]
    >`select id,token,status,token_version from invitations where household_name=${tag}`;
    if (!created) throw new Error("Created household missing");
    ids.push(created.id);
    expect(created.status).toBe("draft");
    expect(created.token_version).toBe(1);
    expect(created.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await page.getByRole("link", { name: "Edit this invitation" }).click();
    await expect(page.getByRole("heading", { name: "Edit invitation", exact: true })).toBeVisible();
    await page.getByLabel("Household name", { exact: true }).fill(`${tag} corrected`);
    await page
      .getByRole("textbox", { name: "Side", exact: true })
      .fill("FamilyAndFriends".repeat(12));
    await page.getByRole("button", { name: "Add a named guest" }).click();
    await page.getByLabel("Guest 2 name", { exact: true }).fill("Synthetic second");
    await page.getByRole("button", { name: "Save invitation", exact: true }).click();
    await expect(
      page.locator("main").getByRole("status").filter({ hasText: "Invitation details saved." }),
    ).toHaveText("Invitation details saved.");
    const membersBefore = await db<
      { id: string }[]
    >`select id from guests where invitation_id=${created.id} order by id`;
    expect(membersBefore).toHaveLength(2);
    await page.getByRole("textbox", { name: "Side", exact: true }).fill("Family corrected");
    await page.getByRole("button", { name: "Save invitation", exact: true }).click();
    await expect
      .poll(async () => (await db`select side from invitations where id=${created.id}`)[0]?.side)
      .toBe("Family corrected");
    expect(await db`select id from guests where invitation_id=${created.id} order by id`).toEqual(
      membersBefore,
    );
    const [edited] = await db`select token,status from invitations where id=${created.id}`;
    expect(edited).toMatchObject({ token: created.token, status: "draft" });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      await page.screenshot({
        path: `docs/reviews/TICKET-090/screenshots/${info.project.name}-${theme.id}-edit.png`,
        fullPage: true,
      });
    }
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    if (info.project.name === "mobile") await page.setViewportSize({ width: 375, height: 900 });
    const opener = page.getByRole("button", { name: "Delete draft", exact: true });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Delete this draft?" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete draft permanently" }).click();
    await expect(page).toHaveURL(/\/admin\/guests\?notice=draft-deleted$/);
    await expect(
      page.getByRole("status").filter({ hasText: "Draft invitation deleted." }),
    ).toHaveText("Draft invitation deleted.");
    await expect(
      page.getByRole("status").filter({ hasText: "Draft invitation deleted." }),
    ).toBeFocused();
    expect(await db`select id from invitations where id=${created.id}`).toHaveLength(0);
    // An attending household keeps its answer and original reply date when corrected.
    const published = randomUUID();
    ids.push(published);
    await db`insert into invitations(id,household_name,token,status) values(${published},${tag + " attending"},${randomBytes(32).toString("base64url")},'rsvp_yes')`;
    await db`insert into guests(invitation_id,name,is_primary,meal_choice,dietary_notes) values(${published},'Existing guest',true,'Vegetarian','No nuts')`;
    await db`insert into rsvps(invitation_id,attending,count_attending,responded_at) values(${published},true,1,'2026-10-01T12:00:00Z')`;
    await page.goto(`/admin/guests/${published}/edit`);
    await expect(page.getByRole("button", { name: "Delete draft", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Add a named guest" }).click();
    await page.getByLabel("Guest 2 name", { exact: true }).fill("Added invited guest");
    await page.getByRole("button", { name: "Save invitation", exact: true }).click();
    await expect(
      page.locator("main").getByRole("status").filter({ hasText: "Invitation details saved." }),
    ).toHaveText("Invitation details saved.");
    const [reply] =
      await db`select attending,count_attending,responded_at from rsvps where invitation_id=${published}`;
    expect(reply).toMatchObject({
      attending: true,
      count_attending: 2,
      responded_at: new Date("2026-10-01T12:00:00Z"),
    });
    expect(
      (await db`select actor from rsvp_changes where invitation_id=${published}`)[0]?.actor,
    ).toMatch(/^admin:/);
    await page.getByRole("button", { name: `Revoke invitation: ${tag} attending` }).click();
    await page
      .getByRole("dialog", { name: "Revoke invitation?" })
      .getByRole("button", { name: "Revoke invitation", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Reissue link: ${tag} attending` }),
    ).toBeFocused();
    expect((await db`select status from invitations where id=${published}`)[0]?.status).toBe(
      "revoked",
    );
  });
});
