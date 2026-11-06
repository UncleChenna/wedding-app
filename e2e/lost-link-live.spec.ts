import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";

test("lost-link submission reaches the private queue and existing Share menu", async ({
  page,
  request,
}, info) => {
  test.skip(process.env.RUN_LOST_LINK_BROWSER_TESTS !== "1", "Requires isolated local Auth and DB");
  test.setTimeout(180_000);
  process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url, { localOnly: true });
  const db = postgres(url, { max: 1 });
  const tag = randomUUID();
  const name = "Sample Guest";
  const contact = `guest-${tag}@example.test`;
  const missingContact = `missing-${tag}@example.test`;
  const token = randomBytes(32).toString("base64url");
  let invitationId: string | undefined;
  const capture = async (state: string) => {
    if (process.env.CAPTURE_LOST_LINK_SCREENSHOTS !== "1") return;
    await mkdir("docs/reviews/TICKET-048/screenshots", { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of themes) {
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await applyTheme(page, theme);
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(scan.violations).toEqual([]);
        await page.screenshot({
          path: `docs/reviews/TICKET-048/screenshots/${state}-${theme.id}-${width}.png`,
          fullPage: true,
        });
        if (state === "admin-queue" && width === 375) {
          const share = page.getByRole("button", { name: "Share invitation", exact: true });
          await share.scrollIntoViewIfNeeded();
          await share.click({ trial: true });
          await page.screenshot({
            path: `docs/reviews/TICKET-048/screenshots/admin-lower-${theme.id}-${width}.png`,
          });
          await page.evaluate(() => window.scrollTo(0, 0));
        }
      }
    }
  };
  try {
    const [invitation] = await db<{ id: string }[]>`
      insert into invitations(token, household_name, status)
      values (${token}, ${name}, 'sent') returning id`;
    if (!invitation) throw new Error("Synthetic invitation missing");
    invitationId = invitation.id;
    await db`insert into guests(invitation_id, name, email, is_primary)
      values (${invitationId}, ${name}, ${contact}, true)`;

    await page.goto("/admin/link-requests");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    const receipts: string[] = [];
    for (const submittedContact of [contact, missingContact]) {
      await page.goto("/lost-link");
      await page.getByLabel("Your full name").fill(name);
      await page.getByLabel("Phone number or email").fill(submittedContact);
      await page.getByRole("button", { name: "Request my link" }).click();
      const receipt = page.getByRole("main").getByRole("status");
      await expect(receipt).toContainText("Your request is with us");
      receipts.push((await receipt.textContent()) ?? "");
      await expect(page.getByRole("button", { name: "Request my link" })).toHaveCount(0);
      expect(await page.content()).not.toContain(token);
      if (submittedContact === contact) await capture("received");
    }
    expect(receipts[0]).toBe(receipts[1]);
    const saved = await db`select contact from invitation_link_requests
      where contact in (${contact}, ${missingContact})`;
    expect(saved).toHaveLength(2);

    await signInAdmin(page, request, adminTestEmail(info.project.name, "lost-link"));
    await page.goto("/admin/link-requests");
    const matched = page.getByRole("listitem").filter({ hasText: contact });
    const unmatched = page.getByRole("listitem").filter({ hasText: missingContact });
    await expect(matched).toContainText(`Matching invitation: ${name}`);
    await expect(unmatched).toContainText("No unique match");
    await expect(unmatched.getByRole("button", { name: "Share invitation" })).toHaveCount(0);
    await capture("admin-queue");
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            document.documentElement.dataset.copied = value;
          },
        },
      });
    });
    const shareTrigger = matched.getByRole("button", { name: "Share invitation", exact: true });
    await shareTrigger.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(shareTrigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.dataset.copied)).toBe(
      new URL(`/i/${token}`, process.env.NEXT_PUBLIC_SITE_URL).href,
    );
  } finally {
    await db`delete from invitation_link_requests where contact in (${contact}, ${missingContact})`;
    if (invitationId) await db`delete from invitations where id = ${invitationId}`;
    await db.end();
  }
});
