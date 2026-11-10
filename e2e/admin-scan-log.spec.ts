import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertAdminJourneyTarget } from "../scripts/admin-journey-ci";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("authenticated scan log", () => {
  test.skip(process.env.RUN_ADMIN_JOURNEY !== "1", "Requires isolated local Auth and database");
  test.setTimeout(180_000);
  let db: Sql;
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertAdminJourneyTarget(process.cwd(), process.env);
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  });
  test.afterAll(async () => {
    if (db) await db.end();
  });
  test("filters offline conflict evidence and appends a resolution without rewriting it", async ({
    page,
    request,
  }, info) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/admin/scans");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    const invitation = randomUUID(),
      staff = randomUUID(),
      device = randomUUID();
    const household = `Synthetic scan household ${info.project.name}`;
    const eventIds = new Map<string, string>();
    await db.begin(async (tx) => {
      await tx`insert into invitations(id,token,status,household_name) values(${invitation},${randomUUID()},'rsvp_yes',${household})`;
      await tx`insert into staff(id,name,role,email) values(${staff},'Synthetic review gate','gate',${`private-${randomUUID()}@example.invalid`})`;
      await tx`insert into registered_devices(id,name,role) values(${device},'Synthetic review scanner','gate')`;
      for (const result of ["valid", "already_used", "invalid", "revoked", "not_rsvped"]) {
        const id = randomUUID();
        eventIds.set(result, id);
        await tx`insert into scan_events(id,client_event_id,invitation_id,staff_id,device_id,reported_at,received_at,reported_result,result,reported_people,admitted_people,conflict,source,input_method)
          values(${id},${randomUUID()},${result === "invalid" ? null : invitation},${staff},${device},'2099-12-19T12:00:00Z','2099-12-19T12:20:00Z','valid',${result},2,0,true,'offline','manual')`;
      }
    });
    await signInAdmin(
      page,
      request,
      `${process.env.ADMIN_JOURNEY_PREFIX}-scans-${info.project.name}@example.test`,
    );
    await page
      .getByRole("navigation", { name: "Admin", exact: true })
      .getByRole("link", { name: "Scan log", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Scan log", exact: true })).toBeVisible();
    await page.addInitScript(() => {
      let cls = 0;
      Object.defineProperty(window, "scanLogCLS", { get: () => cls });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) cls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => Reflect.get(window, "scanLogCLS") as number)).toBe(0);
    await page.getByLabel("Staff", { exact: true }).selectOption(staff);
    await page.getByLabel("Device", { exact: true }).selectOption(device);
    await page.getByLabel("Connection").selectOption("offline");
    await page.getByLabel("Conflicts").selectOption("yes");
    await page.getByLabel("Received from (UTC)").fill("2099-12-19T12:19");
    await page.getByLabel("Received until (UTC)").fill("2099-12-19T12:21");
    for (const result of ["valid", "already_used", "invalid", "revoked", "not_rsvped"]) {
      await page.getByLabel("Result", { exact: true }).selectOption(result);
      await page.getByRole("button", { name: "Apply filters", exact: true }).click();
      await expect(page.getByRole("article")).toHaveCount(1);
      const entry = page.getByRole("article");
      await expect(entry.getByText("Manual entry", { exact: true })).toBeVisible();
      await expect(entry.getByText("Offline sync", { exact: true })).toBeVisible();
      if (result === "invalid") await expect(entry).toHaveAccessibleName("Unknown invitation");
    }
    await page.getByLabel("Result", { exact: true }).selectOption("already_used");
    await page.getByLabel("Invitation", { exact: true }).selectOption(invitation);
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    const eventId = eventIds.get("already_used");
    if (!eventId) throw new Error("Missing synthetic conflict event");
    const before = await db`select * from scan_events where id=${eventId}`;
    await page.getByLabel("Resolution note", { exact: true }).selectOption("explained");
    await page.getByRole("button", { name: "Add note", exact: true }).click();
    await expect(
      page.getByText("Note saved. Original scan evidence is unchanged.", { exact: true }),
    ).toBeVisible();
    const article = page.getByRole("article");
    await expect(
      article
        .getByText("Discrepancy explained — original evidence retained.", { exact: true })
        .first(),
    ).toBeVisible();
    expect(await db`select * from scan_events where id=${eventId}`).toEqual(before);
    expect(
      await db`select resolution from scan_resolution_notes where event_id=${eventId}`,
    ).toEqual([{ resolution: "explained" }]);
    await expect(article.locator('time[datetime="2099-12-19T12:00:00.000Z"]')).toHaveCount(1);
    await expect(article.locator('time[datetime="2099-12-19T12:20:00.000Z"]')).toHaveCount(1);
    expect(await page.locator("main").innerText()).not.toContain("@example.invalid");
    const folder = `artifacts/TICKET-174/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        await applyTheme(page, theme);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const small = await page.locator("main").evaluate((main) =>
          [...main.querySelectorAll("button,select,input:not([type=hidden]),a")]
            .filter((element) => {
              const bounds = element.getBoundingClientRect();
              return bounds.width > 0 && (bounds.width < 44 || bounds.height < 44);
            })
            .map((element) => element.textContent),
        );
        expect(small).toEqual([]);
        await scanA11y(page);
        if (width === 375) {
          await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
          const clear = await page.getByRole("navigation", { name: "Scan pages" }).boundingBox();
          const navigation = await page
            .getByRole("navigation", { name: "Admin", exact: true })
            .boundingBox();
          expect(clear).not.toBeNull();
          expect(navigation).not.toBeNull();
          if (clear && navigation) expect(clear.y + clear.height).toBeLessThanOrEqual(navigation.y);
          await page.evaluate(() => scrollTo(0, 0));
        }
        await page.screenshot({
          path: `${folder}/${theme.id}-${width}-resolved.png`,
          fullPage: true,
        });
      }
    await page.getByRole("link", { name: "Clear filters", exact: true }).click();
    await expect(page.getByLabel("Result", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Invitation", { exact: true })).toHaveValue("");
    await page.getByLabel("Staff", { exact: true }).selectOption(staff);
    await page.getByLabel("Result", { exact: true }).selectOption("invalid");
    await page.getByLabel("Invitation", { exact: true }).selectOption("unknown");
    await page.getByRole("button", { name: "Apply filters", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("article", { name: "Unknown invitation" })).toHaveCount(1);
    // Leave append-only synthetic fixtures intact; the owned CI stack is disposable.
  });
});
