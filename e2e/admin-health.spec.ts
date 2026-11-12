import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { signInAdmin } from "./support/admin-session";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { healthSnapshot } from "../src/modules/admin/lib/health";

// Authentication factors never enter screenshots or traces.
test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("admin health", () => {
  test.skip(process.env.RUN_ADMIN_JOURNEY !== "1", "Requires isolated local Auth");
  test.setTimeout(180_000);
  test("keeps public readiness minimal and renders database failure without disclosing details", async ({
    page,
    request,
  }, info) => {
    const publicResult = await request.get("/api/health");
    expect(publicResult.status()).toBe(200);
    expect(await publicResult.json()).toEqual({ status: "ok" });
    expect(publicResult.headers()["cache-control"]).toContain("no-store");
    expect((await request.get("/api/admin/health")).status()).toBe(403);
    await signInAdmin(
      page,
      request,
      `${process.env.ADMIN_JOURNEY_PREFIX}-health-${info.project.name}@example.test`,
    );
    await page
      .getByRole("navigation", { name: "Admin" })
      .getByRole("link", { name: "Event health" })
      .click();
    await expect(page).toHaveURL(/\/admin\/health$/);
    await expect(page.getByRole("heading", { name: "Event health", exact: true })).toBeVisible();
    await expect(page.getByText("Available", { exact: true })).toBeVisible();
    const response = await page.request.get("/api/admin/health");
    expect(response.status()).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual([
      "checkedAt",
      "database",
      "lastSync",
      "outbox",
      "realtime",
      "version",
    ]);
    const directory = `docs/reviews/TICKET-143/${info.project.name}`;
    mkdirSync(directory, { recursive: true });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${directory}/healthy-375.png`, fullPage: true });
    await page.route("**/api/admin/health", (route) =>
      route.fulfill({ json: healthSnapshot(null, "a".repeat(40)) }),
    );
    await page.getByRole("button", { name: "Refresh health" }).click();
    const unavailable = page.getByText("Unavailable", { exact: true });
    await expect(unavailable).toBeVisible();
    await expect(unavailable).toHaveClass(/bg-danger-subtle/);
    await expect(page.getByText("Check each scanner", { exact: true })).toBeVisible();
    await expect(page.getByText("0 pending · 0 failed", { exact: true })).toHaveCount(0);
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `${directory}/unavailable-${theme.id}-375.png`,
        fullPage: true,
      });
    }
    const refresh = page.getByRole("button", { name: "Refresh health" });
    expect((await refresh.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await refresh.focus();
    await page.keyboard.press("Enter");
    await expect(unavailable).toBeVisible();
    await page.unroute("**/api/admin/health");
    await page.route("**/api/admin/health", (route) =>
      route.fulfill({ status: 403, json: { message: "Please sign in again." } }),
    );
    await refresh.click();
    await expect(page.getByRole("main").getByRole("status")).toHaveText(
      "Please sign in again to view event health.",
    );
    await expect(page.getByRole("heading", { name: "Database", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Back to control room" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });
});
