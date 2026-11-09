import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.describe("authenticated sharing records", () => {
  test.skip(
    process.env.RUN_ADMIN_SHARE_TRACKING_TESTS !== "1",
    "Requires isolated Auth/mail/database and a fresh allowlisted test address",
  );
  test.setTimeout(180_000);
  let db: Sql;
  let invitationId: string;
  const name = `Synthetic sharing ${randomUUID()}`;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(household_name, token, status) values(${name}, ${randomBytes(32).toString("base64url")}, 'draft') returning id`;
    if (!row) throw new Error("Missing share fixture");
    invitationId = row.id;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (invitationId) await db`update invitations set status='revoked' where id=${invitationId}`;
    } finally {
      await db.end();
    }
  });
  test("cancellation is inert, first share refreshes filters and Undo survives, reissue clears stale Undo", async ({
    page,
    request,
  }, info) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => undefined },
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          throw new DOMException("Cancelled", "AbortError");
        },
      });
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    });
    await signInAdmin(
      page,
      request,
      adminTestEmail(info.project.name, process.env.ADMIN_SHARE_TEST_PREFIX ?? "share-tracking"),
    );
    await page.goto("/admin/guests");
    await page.getByRole("searchbox", { name: "Search guests" }).fill(name);
    await page.getByLabel("Sent", { exact: true }).selectOption("unsent");
    const row = page.locator(`[data-invitation-id="${invitationId}"]`);
    await row.getByRole("button", { name: `Invitation actions for ${name}` }).click();
    await row.getByRole("button", { name: "Share invitation", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Share invitation", exact: true });
    await dialog.getByRole("button", { name: "More ways to share" }).click();
    await expect(dialog.getByRole("button", { name: "More ways to share" })).toBeEnabled();
    expect(
      (await db`select status, sent_at from invitations where id=${invitationId}`)[0],
    ).toMatchObject({ status: "draft", sent_at: null });
    expect(
      await db`select id from invitation_share_events where invitation_id=${invitationId}`,
    ).toHaveLength(0);
    // Clipboard success must not hide a failed server-side record.
    await page.route("**/admin/guests", (route) =>
      route.request().method() === "POST" ? route.abort("failed") : route.continue(),
    );
    await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(
      row.getByText("The sharing attempt wasn't recorded. Please try again."),
    ).toBeVisible();
    expect(
      (await db`select status, sent_at from invitations where id=${invitationId}`)[0],
    ).toMatchObject({ status: "draft", sent_at: null });
    await page.unroute("**/admin/guests");
    await row.getByRole("button", { name: "Share invitation", exact: true }).click();
    await page.setViewportSize({ width: 375, height: 812 });
    await mkdir("docs/reviews/TICKET-051/screenshots", { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `docs/reviews/TICKET-051/screenshots/${info.project.name}-${theme.id}-share.png`,
        fullPage: true,
      });
    }
    await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Undo sharing record", exact: true }),
    ).toBeVisible();
    expect(
      (await db`select status, sent_at from invitations where id=${invitationId}`)[0]?.status,
    ).toBe("sent");
    const undoButton = page.getByRole("button", { name: "Undo sharing record", exact: true });
    await undoButton.scrollIntoViewIfNeeded();
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await undoButton.evaluate((button) => button.scrollIntoView({ block: "center" }));
      if (theme.id === "ivory-gold")
        await page.screenshot({
          path: `docs/reviews/TICKET-051/screenshots/${info.project.name}-undo.png`,
        });
    }
    await undoButton.focus();
    await undoButton.press("Enter");
    await expect(row).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: /^1 of \d+ invitations$/ }),
    ).toBeFocused();
    expect(
      (await db`select status, sent_at from invitations where id=${invitationId}`)[0],
    ).toMatchObject({ status: "draft", sent_at: null });
    await page.goto("/admin/sharing");
    const household = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await household.getByRole("button", { name: "Share invitation", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Share invitation", exact: true });
    await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(household.getByRole("button", { name: "Undo sharing record" })).toBeVisible();
    await household.getByRole("button", { name: `Reissue link: ${name}`, exact: true }).click();
    await page
      .getByRole("dialog", { name: "Reissue invitation link?" })
      .getByRole("button", { name: "Create new link" })
      .click();
    await expect(
      household.getByRole("status").filter({ hasText: "New invitation link ready" }),
    ).toBeVisible();
    await expect(household.getByRole("button", { name: "Undo sharing record" })).toHaveCount(0);
    const [updated] = await db<
      { token: string }[]
    >`select token from invitations where id=${invitationId}`;
    if (!updated) throw new Error("Missing reissued row");
    await household.getByRole("button", { name: "Share invitation", exact: true }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      new RegExp(encodeURIComponent(updated.token)),
    );
  });
});
