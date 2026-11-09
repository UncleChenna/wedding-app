import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.describe("day-before pass reminders", () => {
  test.skip(
    process.env.RUN_PASS_REMINDER_BROWSER_TESTS !== "1",
    "Requires isolated Auth and synthetic fixtures",
  );
  test.setTimeout(180_000);
  let db: Sql;
  const id = randomUUID();
  const excludedId = randomUUID();
  const name = `Pass reminder ${randomUUID().slice(0, 8)}`;
  const token = randomBytes(32).toString("base64url");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    await db`insert into invitations(id,household_name,token,status,sent_at) values(${id},${name},${token},'rsvp_yes','2026-10-01T00:00:00Z'),(${excludedId},${name + " declined"},${randomBytes(32).toString("base64url")},'rsvp_no',null)`;
    await db`insert into rsvps(invitation_id,attending,count_attending,responded_at) values(${id},true,1,'2026-11-01T00:00:00Z')`;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        await db`update invitations set status='revoked' where id in (${id},${excludedId})`;
      } finally {
        await db.end();
      }
    }
  });
  test("lists attending households, shares approved day-before copy and preserves RSVP through Undo", async ({
    page,
    request,
  }, info) => {
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    const denied = await request.get("/admin/sharing/pass-reminders", { maxRedirects: 0 });
    expect(denied.status()).toBe(307);
    expect(denied.headers()["cache-control"]).toContain("no-store");
    await page.addInitScript(() => {
      const state = window as unknown as { passReminderCls: number };
      state.passReminderCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) state.passReminderCls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
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
      `${process.env.PASS_REMINDER_TEST_PREFIX}-${info.project.name}@example.test`,
    );
    await page.goto("/admin/sharing");
    await page.getByRole("link", { name: "Prepare day-before pass reminders" }).click();
    await expect(page.getByRole("heading", { name: "Pass reminders", exact: true })).toBeVisible();
    await page.reload();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    expect(
      await page.evaluate(() => (window as unknown as { passReminderCls: number }).passReminderCls),
    ).toBe(0);
    const row = page.locator(`[data-pass-reminder-id="${id}"]`);
    await expect(row).toContainText(`Tomorrow, ${name}! Your entry pass is ready at`);
    await expect(page.locator(`[data-pass-reminder-id="${excludedId}"]`)).toHaveCount(0);
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const folder = `docs/reviews/TICKET-054/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      if (theme.id === "ivory-gold")
        await page.screenshot({ path: `${folder}/pass-reminders.png`, fullPage: true });
    }
    const opener = row.getByRole("button", { name: "Share invitation", exact: true });
    await opener.focus();
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Share invitation", exact: true });
    const whatsapp = new URL(
      (await dialog.getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href")) ??
        "",
    );
    const message = whatsapp.searchParams.get("text") ?? "";
    expect(message).toContain(`Tomorrow, ${name}!`);
    expect(message).toContain(`/i/${token}`);
    expect(message).not.toContain("gentle tap on the shoulder");
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      if (theme.id === "ivory-gold") await page.screenshot({ path: `${folder}/share-menu.png` });
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
      await db`select purpose,channel from invitation_share_events where invitation_id=${id} and undone_at is null`,
    ).toEqual([{ purpose: "invitation", channel: "copy" }]);
    await row.getByRole("button", { name: "Undo sharing record", exact: true }).click();
    await expect(row.getByRole("status")).toBeFocused();
    expect(
      await db`select id from invitation_share_events where invitation_id=${id} and undone_at is null`,
    ).toHaveLength(0);
    expect(
      await db`select status,sent_at::text as sent_at from invitations where id=${id}`,
    ).toEqual([{ status: "rsvp_yes", sent_at: "2026-10-01 00:00:00+00" }]);
    expect(
      await db`select attending,count_attending,responded_at::text as responded_at from rsvps where invitation_id=${id}`,
    ).toEqual([{ attending: true, count_attending: 1, responded_at: "2026-11-01 00:00:00+00" }]);
    for (const width of [375, 600, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page.locator("main button, main a").evaluateAll((elements) =>
          elements
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
            })
            .map((element) => element.textContent),
        ),
      ).toEqual([]);
    }
  });
});
