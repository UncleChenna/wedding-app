import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { invitationSiteCopy } from "../src/modules/invitations/lib/copy";

let db: Sql;
const ids: string[] = [];
const token = () => randomBytes(32).toString("base64url");
test.describe("personal RSVP", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    process.env.RUN_RSVP_BROWSER_TESTS !== "1",
    "Requires explicitly enabled isolated RSVP database",
  );
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const existing = await db`select venue from event_settings where id=1`;
    if (existing.length && existing[0]?.venue !== "RSVP browser test only")
      throw new Error("Refusing to overwrite existing event configuration");
    await db`insert into event_settings(id, time_zone, venue) values(1, 'Etc/UTC', 'RSVP browser test only') on conflict(id) do nothing`;
  });
  test.afterAll(async () => {
    if (db) {
      if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
      await db.end();
    }
  });
  async function invitation() {
    const value = token();
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${value},'RSVP browser household','sent') returning id`;
    if (!row) throw new Error("Missing fixture");
    ids.push(row.id);
    await db`insert into guests(invitation_id,name,is_primary) values(${row.id}, 'Amara Testguest', true)`;
    return { token: value, id: row.id };
  }
  test("yes/no persists and works without JavaScript", async ({ browser, baseURL }) => {
    for (const javaScriptEnabled of [true, false]) {
      const fixture = await invitation();
      const context = await browser.newContext({
        baseURL,
        javaScriptEnabled,
        viewport: { width: 375, height: 812 },
      });
      try {
        const page = await context.newPage();
        await page.goto(`/i/${fixture.token}`);
        for (const [choice, copy, status, attending] of [
          [invitationSiteCopy.attendance.yes, invitationSiteCopy.confirmed, "rsvp_yes", true],
          [invitationSiteCopy.attendance.no, invitationSiteCopy.declined, "rsvp_no", false],
        ] as const) {
          const posted = page.waitForRequest((request) => request.method() === "POST");
          await page.getByRole("button", { name: choice, exact: true }).click();
          const request = await posted;
          const origin = new URL(baseURL ?? "").origin;
          const headers = await request.allHeaders();
          expect(headers.origin).toBe(origin);
          expect(headers.referer).toBe(origin + "/");

          await expect(page.getByRole("status", { name: "Your reply" })).toHaveText(copy);
          const rows =
            await db`select i.status,r.attending,r.count_attending from invitations i join rsvps r on r.invitation_id=i.id where i.id=${fixture.id}`;
          expect(rows).toHaveLength(1);
          expect(rows[0]).toMatchObject({ status, attending, count_attending: attending ? 1 : 0 });
          await page.reload();
          await expect(page.getByRole("status", { name: "Your reply" })).toHaveText(copy);
        }
      } finally {
        await context.close();
      }
    }
  });
  test("a tampered token cannot submit through an existing form", async ({ page }) => {
    const fixture = await invitation();
    await page.goto(`/i/${fixture.token}`);
    await page.locator('input[name="token"]').evaluate((el: HTMLInputElement) => {
      el.value = "invalid-token";
    });
    await page
      .getByRole("button", { name: invitationSiteCopy.attendance.yes, exact: true })
      .click();
    await expect(page.getByRole("status", { name: "Your reply" })).toContainText("try again");
    expect(await db`select id from rsvps where invitation_id=${fixture.id}`).toHaveLength(0);
  });
  test("revocation between rendering and posting rejects the reply", async ({ page }) => {
    const fixture = await invitation();
    await page.goto(`/i/${fixture.token}`);
    await db`update invitations set status='revoked' where id=${fixture.id}`;
    const response = page.waitForResponse((response) => response.request().method() === "POST");
    await page
      .getByRole("button", { name: invitationSiteCopy.attendance.yes, exact: true })
      .click();
    await response;
    await expect(
      page.getByText(/This invitation is no longer available|This page wandered off/).first(),
    ).toBeVisible();
    await expect(page.getByText(invitationSiteCopy.confirmed, { exact: true })).toHaveCount(0);
    await expect
      .poll(
        async () => (await db`select status from invitations where id=${fixture.id}`)[0]?.status,
      )
      .toBe("revoked");
    expect(await db`select id from rsvps where invitation_id=${fixture.id}`).toHaveLength(0);
  });
});
