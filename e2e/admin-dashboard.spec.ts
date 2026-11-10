import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertAdminJourneyTarget } from "../scripts/admin-journey-ci";
import { signInAdmin } from "./support/admin-session";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

// OTP/TOTP must never enter automatic screenshots, videos or traces.
test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("authenticated live dashboard", () => {
  test.skip(process.env.RUN_ADMIN_JOURNEY !== "1", "Requires isolated local Auth and database");
  test.setTimeout(180_000);
  let db: Sql;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertAdminJourneyTarget(process.cwd(), process.env);
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  });
  test.afterAll(async () => {
    if (db) await db.end();
  });

  test("protects counters and shows a committed admission within two seconds", async ({
    page,
    request,
  }, info) => {
    const denied = await request.get("/api/admin/dashboard");
    expect(denied.status()).toBe(403);
    expect(denied.headers()["cache-control"]).toContain("no-store");
    await signInAdmin(
      page,
      request,
      `${process.env.ADMIN_JOURNEY_PREFIX}-counters-${info.project.name}@example.test`,
    );
    await page.addInitScript(() => {
      let total = 0;
      Object.defineProperty(window, "dashboardCLS", { get: () => total });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) total += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.reload();
    const response = await page.request.get("/api/admin/dashboard");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const baseline = await response.json();
    expect(Object.keys(baseline).sort()).toEqual([
      "arrived",
      "attending",
      "invited",
      "ordersOpen",
      "ordersServed",
    ]);
    const arrived = page.locator('[data-counter="arrived"]');
    await expect(arrived).toHaveText(Number(baseline.arrived).toLocaleString("en-GB"));
    await page.evaluate(() => document.fonts.ready);
    const cls = await page.evaluate(() => Reflect.get(window, "dashboardCLS") as number);
    expect(cls).toBe(0);
    const invitation = randomUUID(),
      staff = randomUUID(),
      device = randomUUID();
    // Append-only evidence stays in this disposable fixture; no guards are disabled.
    await db.begin(async (tx) => {
      await tx`insert into invitations(id,token,status) values(${invitation},${randomUUID().replaceAll("-", "")},'rsvp_yes')`;
      await tx`insert into rsvps(invitation_id,attending,count_attending) values(${invitation},true,3)`;
      await tx`insert into staff(id,name,role) values(${staff},'Synthetic dashboard gate','gate')`;
      await tx`insert into registered_devices(id,name,role) values(${device},'Synthetic dashboard scanner','gate')`;
    });
    // Include the database round trip: this is stricter than commit-to-observation alone.
    const started = performance.now();
    await db`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source)
      values(${randomUUID()},${invitation},${staff},${device},now(),'valid','valid',2,2,'online')`;
    await expect(arrived).toHaveText((Number(baseline.arrived) + 2).toLocaleString("en-GB"), {
      timeout: 2000,
    });
    const elapsed = performance.now() - started;
    expect(elapsed).toBeLessThan(2000);
    const snapshot = await page.request.get("/api/admin/dashboard");
    expect((await snapshot.json()).arrived).toBe(Number(baseline.arrived) + 2);

    const directory = `artifacts/TICKET-097/${info.project.name}`;
    mkdirSync(directory, { recursive: true });
    await page.route("**/api/admin/dashboard", (route) => route.fulfill({ status: 503 }));
    await page.getByRole("button", { name: "Refresh counts" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Showing the last received counts" }),
    ).toBeVisible();
    await expect(arrived).toHaveText((Number(baseline.arrived) + 2).toLocaleString("en-GB"));
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({ path: `${directory}/stale-375.png`, fullPage: true });
    await page.unroute("**/api/admin/dashboard");
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const button = page.getByRole("button", { name: "Refresh counts" });
        const bounds = await button.boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        await button.focus();
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("status").filter({ hasText: "Updating automatically" }),
        ).toBeVisible();
        await page.screenshot({ path: `${directory}/${theme.id}-${width}.png`, fullPage: true });
        if (width === 375) {
          for (const key of ["attending", "arrived"]) {
            const counter = page.locator(`[data-counter="${key}"]`);
            await counter.evaluate((element) => element.scrollIntoView({ block: "center" }));
            const counterBox = await counter.boundingBox();
            const navigationBox = await page
              .getByRole("navigation", { name: "Admin", exact: true })
              .boundingBox();
            expect(counterBox).not.toBeNull();
            expect(navigationBox).not.toBeNull();
            expect((counterBox?.y ?? 0) + (counterBox?.height ?? 0)).toBeLessThan(
              navigationBox?.y ?? 0,
            );
            await page.screenshot({ path: `${directory}/${theme.id}-${key}-375-viewport.png` });
          }
        }
      }
    writeFileSync(
      `${directory}/timing.json`,
      JSON.stringify(
        { admissionUpdateMs: elapsed, cls, authenticated: true, physicalDevicesVerified: false },
        null,
        2,
      ),
    );
    await page.context().clearCookies();
    await page.getByRole("button", { name: "Refresh counts" }).click();
    await expect(
      page.getByRole("region", { name: "Live dashboard" }).getByRole("link", { name: "Sign in" }),
    ).toBeVisible();
    await expect(arrived).toHaveText("—");
    expect((await page.request.get("/api/admin/dashboard")).status()).toBe(403);
  });
});
