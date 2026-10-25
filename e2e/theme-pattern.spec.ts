import { expect, test } from "@playwright/test";

import { getActiveTheme } from "../src/modules/theming";

/** Optional theme paper texture (TICKET-011): guest pages only, only when the theme has one. */
test.describe("theme pattern @smoke", () => {
  const theme = getActiveTheme();

  test("guest pages render the active theme's pattern (or none) behind the content", async ({
    page,
  }) => {
    await page.goto("/");
    const layer = page.locator("[data-theme-pattern]");
    if (!theme.pattern) {
      await expect(layer).toHaveCount(0);
      return;
    }
    await expect(layer).toHaveCount(1);
    const style = await layer.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        mask: s.maskImage || s.getPropertyValue("-webkit-mask-image"),
        opacity: s.opacity,
        zIndex: s.zIndex,
        pointerEvents: s.pointerEvents,
        hidden: el.getAttribute("aria-hidden"),
      };
    });
    expect(style.mask).toContain(theme.pattern.src);
    expect(Number(style.opacity)).toBeCloseTo(theme.pattern.strength, 3);
    expect(style.zIndex).toBe("-1");
    expect(style.pointerEvents).toBe("none");
    expect(style.hidden).toBe("true");
    const asset = await page.request.get(theme.pattern.src);
    expect(asset.ok()).toBe(true);
  });

  test("staff and admin screens stay plain", async ({ page }) => {
    for (const path of ["/checkin", "/kitchen", "/admin"]) {
      await page.goto(path);
      await expect(page.locator("[data-theme-pattern]"), path).toHaveCount(0);
    }
  });
});
