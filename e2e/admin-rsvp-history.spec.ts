import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { themes } from "../src/modules/theming/themes";

test.describe("admin RSVP history", () => {
  test.skip(
    process.env.RUN_ADMIN_RSVP_HISTORY_TESTS !== "1",
    "Requires isolated local Auth/database and fresh allowlisted address",
  );
  test.setTimeout(180_000);
  let db: Sql;
  const ids: string[] = [];
  const changes: string[] = [];
  const suffix = randomBytes(4).toString("hex");
  const name = `History household ${suffix}`;
  const secret = `private-marker-${suffix}`;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    for (let i = 0; i < 2; i++) {
      const [row] = await db<
        { id: string }[]
      >`insert into invitations(household_name,token,status) values(${i ? `Empty ${suffix}` : name},${randomUUID().replaceAll("-", "")},'draft') returning id`;
      if (!row) throw new Error("Missing history fixture");
      ids.push(row.id);
    }
    const invitationId = ids[0];
    if (!invitationId) throw new Error("Missing invitation fixture");
    const snapshot = {
      status: "rsvp_yes",
      rsvp: { attending: true, countAttending: 2, respondedAt: "2026-10-01T10:00:00Z" },
      people: [
        {
          id: secret,
          name: `Ada ${"LongName".repeat(15)}`,
          isPrimary: true,
          mealChoice: "Rice",
          dietaryNotes: "No nuts",
        },
      ],
      token: secret,
      email: secret,
    };
    // Insert out of chronological order to prove SQL ordering rather than insertion order.
    for (const [index, at] of [
      "2026-10-01T10:00:00Z",
      "2026-11-01T10:00:00Z",
      "2026-10-15T10:00:00Z",
    ].entries()) {
      const [row] = await db<
        { id: string }[]
      >`insert into rsvp_changes(invitation_id,before,after,actor,changed_at) values(${invitationId},${db.json(snapshot)},${db.json({ ...snapshot, rsvp: { attending: true, countAttending: index + 1 } })},${index === 1 ? `admin:${secret}` : "guest"},${at}) returning id`;
      if (!row) throw new Error("Missing history record");
      changes.push(row.id);
    }
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      for (const id of ids) await db`update invitations set status='revoked' where id=${id}`;
    } finally {
      await db.end();
    }
  });
  test("lists every seeded change newest first through guest navigation, privately and accessibly", async ({
    page,
    request,
  }, info) => {
    const id = ids[0];
    const emptyId = ids[1];
    if (!id || !emptyId) throw new Error("Missing fixtures");
    const path = `/admin/guests/${id}/history`;
    const denied = await request.get(path, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(denied.status());
    expect(await denied.text()).not.toContain(name);
    await signInAdmin(
      page,
      request,
      adminTestEmail(info.project.name, process.env.ADMIN_RSVP_HISTORY_PREFIX ?? "rsvp-history"),
    );
    await page.goto("/admin/guests");
    await page.getByLabel("Search guests", { exact: true }).fill(name);
    await page.getByRole("button", { name: `Invitation actions for ${name}` }).click();
    const historyLink = page.getByRole("link", { name: `Reply history for ${name}` });
    await historyLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${id}/history$`));
    const response = await page.reload();
    expect(response?.headers()["cache-control"]).toContain("no-store");
    const html = await page.content();
    expect(html).not.toContain(secret);
    await expect(page.getByRole("heading", { name: "Reply history", exact: true })).toBeVisible();
    const entries = page.locator("[data-history-entry]");
    await expect(entries).toHaveCount(3);
    expect(
      await entries.evaluateAll((rows) =>
        rows.map((row) => row.getAttribute("data-history-entry")),
      ),
    ).toEqual([changes[1], changes[2], changes[0]]);
    expect(
      await entries
        .locator("time")
        .evaluateAll((times) => times.map((time) => time.getAttribute("datetime"))),
    ).toEqual(["2026-11-01T10:00:00.000Z", "2026-10-15T10:00:00.000Z", "2026-10-01T10:00:00.000Z"]);
    await expect(page.getByText("Admin update", { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mkdir(`docs/reviews/TICKET-100/${info.project.name}`, { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (theme.id === "ivory-gold") {
        await page.screenshot({ path: `docs/reviews/TICKET-100/${info.project.name}/history.png` });
        await page.getByText("After", { exact: true }).first().scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `docs/reviews/TICKET-100/${info.project.name}/history-details.png`,
        });
      }
    }
    for (const width of [600, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole("link", { name: "Back to guests" }).click();
    await expect(page).toHaveURL(/\/admin\/guests$/);
    await page.goto(`/admin/guests/${emptyId}/history`);
    await expect(
      page.getByText("No reply changes have been recorded for this invitation yet."),
    ).toBeVisible();
    await expect(page.locator("[data-history-entry]")).toHaveCount(0);
    await page.goto("/admin/guests/not-an-id/history");
    await expect(page.getByRole("heading", { name: "This page wandered off" })).toBeVisible();
  });
});
