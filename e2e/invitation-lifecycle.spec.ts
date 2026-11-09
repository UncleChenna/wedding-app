import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";

for (const theme of themes) {
  for (const width of [375, 768, 1280]) {
    test(`invitation lifecycle @smoke ${theme.id} ${width}: confirmation, cancellation and honest offline copy`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/dev/share");
      await applyTheme(page, theme);
      const trigger = page.getByRole("button", { name: "Revoke invitation: Alex Morgan" });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const revoke = page.getByRole("dialog", { name: "Revoke invitation?" });
      await expect(revoke).toBeVisible();
      await expect(revoke).toContainText(
        "Offline scanners will learn this change when they refresh.",
      );
      await expect(revoke).toContainText("Their saved reply will be kept.");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      const targets = await revoke.locator("button").evaluateAll((buttons) =>
        buttons.map((button) => {
          const bounds = button.getBoundingClientRect();
          return bounds.width >= 44 && bounds.height >= 44;
        }),
      );
      expect(targets.every(Boolean)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (process.env.CAPTURE_LIFECYCLE_SCREENSHOTS === "1")
        await page.screenshot({
          path: `docs/reviews/TICKET-043/screenshots/${theme.id}-${width}-revoke.png`,
          fullPage: true,
        });
      await page.keyboard.press("Escape");
      await expect(revoke).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await revoke.getByRole("button", { name: "Revoke invitation", exact: true }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "Sample invitation revoked" }),
      ).toBeVisible();
      await expect(trigger).toHaveCount(0);
      await page.getByRole("button", { name: "Reissue link: Alex Morgan" }).click();
      const reissue = page.getByRole("dialog", { name: "Reissue invitation link?" });
      await expect(reissue).toBeVisible();
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);

      if (process.env.CAPTURE_LIFECYCLE_SCREENSHOTS === "1")
        await page.screenshot({
          path: `docs/reviews/TICKET-043/screenshots/${theme.id}-${width}-reissue.png`,
          fullPage: true,
        });
      await reissue.getByRole("button", { name: "Create new link" }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "Sample link reissued" }),
      ).toBeVisible();
      await expect(trigger).toBeVisible();
    });
  }
}

test("revocation snapshot requires a gate session @smoke", async ({ request }) => {
  const response = await request.get("/api/checkin/revocations");
  expect(response.status()).toBe(403);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.text()).not.toContain("invitationId");
});

for (const width of [375, 768, 1280]) {
  test(`sharing preview load has zero CLS at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
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
    await page.goto("/dev/share");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => (window as unknown as { lifecycleCls: number }).lifecycleCls),
    ).toBe(0);
  });
}
