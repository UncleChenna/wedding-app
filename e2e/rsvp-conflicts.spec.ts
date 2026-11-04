import { randomBytes } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { removeInvitationFixtures } from "./support/local-fixtures";

test.describe("saved RSVP revisions and cutoffs", () => {
  test.skip(
    process.env.RUN_RSVP_BROWSER_TESTS !== "1",
    "Explicit managed local RSVP fixtures required",
  );
  let db: Sql;
  const ids: string[] = [];
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const existing = await db`select venue from event_settings where id=1`;
    if (existing.length && existing[0]?.venue !== "RSVP browser test only")
      throw new Error("Refusing to overwrite event configuration");
    await db`insert into event_settings(id,time_zone,venue) values(1,'Etc/UTC','RSVP browser test only') on conflict(id) do nothing`;
  });
  test.afterAll(async () => {
    if (db) {
      await removeInvitationFixtures(db, ids);
      await db.end();
    }
  });
  async function fixture() {
    const token = randomBytes(32).toString("base64url");
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,status) values(${token},'sent') returning id`;
    if (!row) throw new Error("Missing fixture");
    ids.push(row.id);
    await db`insert into guests(invitation_id,name,is_primary) values(${row.id},'Synthetic revision guest',true)`;
    return { ...row, token };
  }
  test("another device must refresh before overwriting a saved answer", async ({
    browser,
    baseURL,
  }) => {
    const f = await fixture();
    const first = await browser.newContext({ baseURL });
    const second = await browser.newContext({ baseURL });
    try {
      const a = await first.newPage();
      const b = await second.newPage();
      await Promise.all([a.goto("/i/" + f.token), b.goto("/i/" + f.token)]);
      await a.getByRole("button", { name: "Count me in", exact: true }).click();
      await expect(a.getByRole("status", { name: "Your reply" })).toContainText("You're in.");
      await b.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
      await expect(b.getByRole("status", { name: "Your reply" })).toContainText(
        "updated on another device",
      );
      expect(
        (await db`select attending from rsvps where invitation_id=${f.id}`)[0]?.attending,
      ).toBe(true);
      await b.reload();
      await b.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
      await expect(b.getByRole("status", { name: "Your reply" })).toContainText("We'll miss you");
      expect(
        (await db`select rsvp_revision from invitations where id=${f.id}`)[0]?.rsvp_revision,
      ).toBe(2);
      expect(await db`select id from rsvp_changes where invitation_id=${f.id}`).toHaveLength(2);
    } finally {
      await first.close();
      await second.close();
    }
  });
  test("a deadline passing after page load is still enforced on POST", async ({ page }) => {
    const f = await fixture();
    await page.goto("/i/" + f.token);
    await db`update event_settings set rsvp_lock_at='2000-01-01T00:00:00Z' where id=1`;
    try {
      await page.getByRole("button", { name: "Count me in", exact: true }).click();
      await expect(
        page.getByText("Replies are closed. Please contact the couple to request a change.", {
          exact: true,
        }),
      ).toBeVisible();
      expect(await db`select id from rsvps where invitation_id=${f.id}`).toHaveLength(0);
    } finally {
      await db`update event_settings set rsvp_lock_at=null where id=1`;
    }
  });
});
