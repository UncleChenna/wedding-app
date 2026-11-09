import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.describe("administrator reminders", () => {
  test.skip(
    process.env.RUN_REMINDER_BROWSER_TESTS !== "1",
    "Needs isolated Auth and synthetic database fixtures",
  );
  test.setTimeout(180_000);
  let db: Sql;
  let id: string;
  const name = `Reminder household ${randomUUID().slice(0, 8)}`;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(household_name, token, status, sent_at) values (${name}, ${randomBytes(32).toString("base64url")}, 'sent', '2026-10-01T00:00:00Z') returning id`;
    if (!row) throw new Error("Missing fixture");
    id = row.id;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (id) await db`update invitations set status='revoked' where id=${id}`;
      } finally {
        await db.end();
      }
    }
  });
  test("approved reminder, cancelled native sharing, persisted attempt and Undo, then reply exclusion", async ({
    page,
    request,
  }, info) => {
    const denied = await request.get("/admin/sharing/reminders", { maxRedirects: 0 });
    expect(denied.status()).toBe(307);
    expect(denied.headers()["cache-control"]).toContain("no-store");
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
      adminTestEmail(info.project.name, process.env.REMINDER_TEST_PREFIX ?? "reminders"),
    );
    await page.goto("/admin/sharing");
    await page.getByRole("link", { name: "Remind guests awaiting a reply" }).click();
    await expect(page.getByRole("heading", { name: "A gentle reminder" })).toBeVisible();
    const row = page.locator(`[data-reminder-id="${id}"]`);
    await expect(row).toContainText("2026-10-01 00:00:00 UTC");
    await page.setViewportSize({ width: 375, height: 812 });
    const folder = "docs/reviews/TICKET-053";
    await mkdir(folder, { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (theme.id === "ivory-gold")
        await page.screenshot({ path: `${folder}/reminders.png`, fullPage: true });
    }
    const opener = row.getByRole("button", { name: "Share reminder", exact: true });
    const firstShare = page.getByRole("button", { name: "Share reminder", exact: true }).first();
    await firstShare.scrollIntoViewIfNeeded();
    await firstShare.focus();
    await firstShare.press("Enter");
    await expect(page.getByRole("dialog", { name: "Share reminder", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(firstShare).toBeFocused();
    await opener.focus();
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Share reminder", exact: true });
    await dialog.getByRole("button", { name: "Copy link", exact: true }).focus();
    await expect(dialog.getByRole("button", { name: "Copy link", exact: true })).toBeInViewport();
    await expect(dialog).toContainText(
      `Hi ${name}, a gentle tap on the shoulder from Uchenna & Adaora.`,
    );
    const whatsapp = new URL(
      (await dialog.getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href")) ??
        "",
    );
    expect(whatsapp.searchParams.get("text")).toContain("We're setting tables and menus");
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (theme.id === "ivory-gold") await page.screenshot({ path: `${folder}/reminder-menu.png` });
    }
    await dialog.getByRole("button", { name: "More ways to share" }).click();
    await expect(dialog.getByRole("button", { name: "More ways to share" })).toBeEnabled();
    expect(await db`select id from invitation_share_events where invitation_id=${id}`).toHaveLength(
      0,
    );
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await opener.press("Enter");
    await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(
      row.getByText("Sharing attempt recorded. This does not confirm delivery."),
    ).toBeVisible();
    expect(
      await db`select purpose, channel from invitation_share_events where invitation_id=${id} and undone_at is null`,
    ).toEqual([{ purpose: "reminder", channel: "copy" }]);
    await expect(row.getByRole("time")).not.toHaveText("2026-10-01 00:00:00 UTC");
    await row.getByRole("button", { name: "Undo sharing record", exact: true }).click();
    await expect(row.getByRole("status")).toBeFocused();
    await expect(row).toContainText("2026-10-01 00:00:00 UTC");
    expect(
      await db`select id from invitation_share_events where invitation_id=${id} and undone_at is null`,
    ).toHaveLength(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [600, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await db`insert into rsvps(invitation_id, attending, count_attending) values (${id}, false, 0)`;
    await page.reload();
    await expect(row).toHaveCount(0);
    expect((await db`select status, sent_at from invitations where id=${id}`)[0]?.status).toBe(
      "sent",
    );
  });
});
