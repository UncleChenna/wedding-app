import { existsSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../../scripts/database-target";
import { listThemes } from "../../src/modules/theming";
import { applyTheme } from "../support/theme";

/**
 * Visual regression for every guest page (TICKET-135, PRD "What flawless means in testing"):
 * each preset theme at iPhone SE, iPhone 15, a mid-range Android, iPad and desktop sizes.
 * Baselines are generated and compared on CI's Linux runner (the "visual regression" job), so
 * fonts and rendering match; run locally only to check stability. 1x pixel density keeps the
 * committed images small.
 */
const DEVICES = [
  { name: "iphone-se", width: 375, height: 667, mobile: true },
  { name: "iphone-15", width: 393, height: 852, mobile: true },
  { name: "android", width: 360, height: 800, mobile: true },
  { name: "ipad", width: 820, height: 1180, mobile: true },
  { name: "desktop", width: 1280, height: 800, mobile: false },
] as const;

// A fixed invitation, so its page renders the same every run.
const TOKEN = "visual-regression-invitation-0000000000000";
const HOUSEHOLD = "The Example Household";

let db: Sql | undefined;
let invitationId = "";
let passPath: string | null = null;

/** Parts of a page that change by design between runs (a signed QR code). */
const dynamic = (page: Page) => [page.locator("svg[aria-label*='QR'], [data-qr], img[alt*='QR']")];

const ROUTES: { name: string; path: () => string | null }[] = [
  { name: "home", path: () => "/" },
  { name: "invite", path: () => "/invite" },
  { name: "lost-link", path: () => "/lost-link" },
  { name: "order", path: () => "/order" },
  { name: "offline", path: () => "/offline" },
  { name: "invitation", path: () => `/i/${TOKEN}` },
  { name: "pass", path: () => passPath },
];

test.describe("guest pages look the same", () => {
  test.skip(process.env.RUN_VISUAL_REGRESSION !== "1", "Run in the CI visual regression job");

  test.beforeAll(async ({ browser }) => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    // Shared by parallel workers: created once, never deleted mid-run. CI's database is
    // discarded after the job; locally it's disposable test data.
    await db`insert into invitations (token, household_name, status)
      values (${TOKEN}, ${HOUSEHOLD}, 'rsvp_yes') on conflict (token) do nothing`;
    const [row] = await db<{ id: string }[]>`select id from invitations where token = ${TOKEN}`;
    invitationId = row?.id ?? "";
    await db`insert into guests (invitation_id, name, is_primary)
      select ${invitationId}, 'Ada Example', true
      where not exists (select 1 from guests where invitation_id = ${invitationId})`;
    await db`insert into rsvps (invitation_id, attending, count_attending)
      values (${invitationId}, true, 1) on conflict (invitation_id) do nothing`;
    // The pass link is only shown when gate signing keys are configured (the CI job sets fixed ones).
    const page = await browser.newPage();
    await page.goto(`/i/${TOKEN}`);
    const link = page.locator("a[href^='/p/']").first();
    passPath = (await link.count()) ? await link.getAttribute("href") : null;
    await page.close();
  });

  test.afterAll(async () => {
    await db?.end();
  });

  for (const theme of listThemes())
    for (const device of DEVICES)
      for (const route of ROUTES)
        test(`${route.name} · ${theme.id} · ${device.name}`, async ({ page }) => {
          const path = route.path();
          test.skip(!path, "No pass link without gate signing keys");
          await page.setViewportSize({ width: device.width, height: device.height });
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.goto(path ?? "/");
          await page.evaluate(() => document.fonts.ready);
          await applyTheme(page, theme);
          await expect(page).toHaveScreenshot(`${route.name}-${theme.id}-${device.name}.png`, {
            fullPage: true,
            animations: "disabled",
            caret: "hide",
            mask: dynamic(page),
            // A token change recolours whole regions; this only absorbs anti-aliasing noise.
            maxDiffPixelRatio: 0.002,
            // Any colour change counts: baselines are made and compared on the same Linux runner.
            threshold: 0,
          });
        });
});
