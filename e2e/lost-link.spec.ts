import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";

for (const theme of themes) {
  for (const width of [375, 768, 1280]) {
    test(`lost-link form @smoke ${theme.id} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const response = await page.goto("/lost-link");
      expect(response?.headers()["cache-control"]).toContain("no-store");
      await applyTheme(page, theme);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { name: "Let’s find your link" })).toBeVisible();
      const name = page.getByRole("textbox", { name: "Your full name" });
      await name.focus();
      await page.keyboard.press("Tab");
      await expect(page.getByRole("textbox", { name: "Phone number or email" })).toBeFocused();
      await page.keyboard.press("Tab");
      const submit = page.getByRole("button", { name: "Request my link" });
      await expect(submit).toBeFocused();
      for (const control of [
        name,
        page.getByRole("textbox", { name: "Phone number or email" }),
        submit,
      ]) {
        const box = await control.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
        expect(box?.width).toBeGreaterThanOrEqual(44);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(scan.violations).toEqual([]);
      if (process.env.CAPTURE_LOST_LINK_SCREENSHOTS === "1") {
        await mkdir("docs/reviews/TICKET-048/screenshots", { recursive: true });
        await page.screenshot({
          path: `docs/reviews/TICKET-048/screenshots/form-${theme.id}-${width}.png`,
          fullPage: true,
        });
      }
    });
  }
}

for (const width of [375, 768, 1280]) {
  test(`lost-link initial load @smoke CLS ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      let cls = 0;
      new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          if ("hadRecentInput" in entry && !entry.hadRecentInput && "value" in entry) {
            cls += Number(entry.value);
            document.documentElement.dataset.lostLinkCls = String(cls);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/lost-link");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => Number(document.documentElement.dataset.lostLinkCls ?? "0")),
    ).toBe(0);
  });
}
