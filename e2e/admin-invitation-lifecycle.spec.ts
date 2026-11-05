import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";

test.describe("authenticated invitation lifecycle", () => {
  test.skip(
    process.env.RUN_ADMIN_LIFECYCLE_TESTS !== "1",
    "Requires this worktree's local Auth, mail, gateway and database with an allowlisted test address",
  );
  test.setTimeout(180_000);
  let db: Sql;
  let invitationId: string | undefined;
  const tag = `Lifecycle ${randomUUID()}`;
  const originalToken = randomBytes(32).toString("base64url");

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [row] = await db<{ id: string }[]>`
      insert into invitations (household_name, token, status, token_version)
      values (${tag}, ${originalToken}, 'rsvp_yes', 7) returning id`;
    invitationId = row?.id;
    if (!invitationId) throw new Error("Missing lifecycle fixture");
    await db`insert into guests(invitation_id, name, is_primary)
      values (${invitationId}, ${tag}, true)`;
    await db`insert into rsvps(invitation_id, attending, count_attending)
      values (${invitationId}, true, 1)`;
  });

  test.afterAll(async () => {
    if (!db) return;
    try {
      if (invitationId) {
        // Keep audit evidence; deactivate only this test's synthetic invitation.
        await db`update invitations set status='revoked' where id=${invitationId}`;
      }
    } finally {
      await db.end();
    }
  });

  test("real admin confirmation rotates the link, rejects old access and preserves the saved reply", async ({
    page,
    request,
    browser,
    baseURL,
  }, info) => {
    if (!invitationId) throw new Error("Missing lifecycle fixture");
    const activeInvitationId = invitationId;
    const email = adminTestEmail(
      info.project.name,
      process.env.ADMIN_LIFECYCLE_TEST_PREFIX ?? "lifecycle",
    );
    await signInAdmin(page, request, email);
    await page.addInitScript(() => {
      const state = window as unknown as { lifecycleCls: number };
      state.lifecycleCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) state.lifecycleCls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/admin/sharing");
    await expect(page.getByRole("heading", { name: "Sharing", exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => (window as unknown as { lifecycleCls: number }).lifecycleCls),
    ).toBe(0);
    const controls = page.getByRole("group", { name: `${tag}: invitation controls`, exact: true });
    await expect(controls).toBeVisible();
    const visitor = await browser.newContext({ baseURL });
    try {
      const original = await visitor.request.get(`/i/${originalToken}`);
      expect(original.status()).toBe(200);
      expect(await original.text()).toContain(tag);

      await controls.getByRole("button", { name: `Reissue link: ${tag}`, exact: true }).click();
      let dialog = page.getByRole("dialog", { name: "Reissue invitation link?" });
      await expect(dialog).toContainText("Their saved reply will be kept");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      expect(
        (await db`select token, token_version from invitations where id=${activeInvitationId}`)[0],
      ).toMatchObject({ token: originalToken, token_version: 7 });
      expect(
        await db`select id from invitation_lifecycle_events where invitation_id=${activeInvitationId}`,
      ).toHaveLength(0);

      await controls.getByRole("button", { name: `Reissue link: ${tag}`, exact: true }).click();
      dialog = page.getByRole("dialog", { name: "Reissue invitation link?" });
      await dialog.getByRole("button", { name: "Create new link", exact: true }).click();
      await expect(controls.getByRole("status")).toContainText("New invitation link ready");
      const [reissued] = await db<{ token: string; token_version: number; status: string }[]>`
        select token, token_version, status from invitations where id=${activeInvitationId}`;
      if (!reissued) throw new Error("Missing reissued invitation");
      expect(reissued.token).not.toBe(originalToken);
      expect(reissued.token_version).toBe(8);
      expect(reissued.status).toBe("rsvp_yes");
      const old = await visitor.request.get(`/i/${originalToken}`);
      expect(old.status()).toBe(404);
      expect(await old.text()).not.toContain(tag);
      const current = await visitor.request.get(`/i/${reissued.token}`);
      expect(current.status()).toBe(200);
      expect(await current.text()).toContain(tag);

      await controls
        .getByRole("button", { name: `Revoke invitation: ${tag}`, exact: true })
        .click();
      const revoke = page.getByRole("dialog", { name: "Revoke invitation?" });
      await expect(revoke).toContainText(
        "Offline scanners will learn this change when they refresh",
      );
      await revoke.getByRole("button", { name: "Revoke invitation", exact: true }).click();
      await expect(controls.getByRole("status")).toContainText("Invitation revoked");
      const withdrawn = await visitor.request.get(`/i/${reissued.token}`);
      expect(withdrawn.status()).toBe(404);
      expect(await withdrawn.text()).not.toContain(tag);
      expect(
        (
          await db`select attending, count_attending from rsvps where invitation_id=${activeInvitationId}`
        )[0],
      ).toMatchObject({ attending: true, count_attending: 1 });
      const history = await db`
        select operation, actor_id, occurred_at, before_version, after_version
        from invitation_lifecycle_events where invitation_id=${activeInvitationId} order by occurred_at, id`;
      expect(history).toHaveLength(2);
      expect(history.map((event) => event.operation)).toEqual(["reissue", "revoke"]);
      const [actor] = await db`select id from auth.users where email=${email}`;
      if (!actor) throw new Error("Missing authenticated test actor");
      for (const event of history) {
        expect(event.actor_id).toBe(actor.id);
        expect(event.occurred_at).toBeInstanceOf(Date);
      }
      expect(JSON.stringify(history)).not.toContain(originalToken);
      expect(JSON.stringify(history)).not.toContain(reissued.token);
    } finally {
      await visitor.close();
    }
  });
});
