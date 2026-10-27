import { expect, test } from "@playwright/test";

import { getActiveThemes } from "../src/modules/theming";

/**
 * Optional theme paper texture (TICKET-011): guest pages only, and only in a device colour
 * scheme whose theme has one (TICKET-204).
 */
test.describe("theme pattern @smoke", () => {
  const themes = getActiveThemes();

  for (const colorScheme of ["light", "dark"] as const) {
    const theme = themes[colorScheme];

    test(`guest pages show ${theme.id}'s pattern (or none) in ${colorScheme} mode`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      const layer = page.locator("[data-theme-pattern]");
      if (!themes.light.pattern && !themes.dark.pattern) {
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
      expect(style.zIndex).toBe("-1");
      expect(style.pointerEvents).toBe("none");
      expect(style.hidden).toBe("true");
      if (!theme.pattern) {
        expect(style.mask).toBe("none");
        expect(Number(style.opacity)).toBe(0);
        return;
      }
      expect(style.mask).toContain(theme.pattern.src);
      expect(Number(style.opacity)).toBeCloseTo(theme.pattern.strength, 3);
      const asset = await page.request.get(theme.pattern.src);
      expect(asset.ok()).toBe(true);
    });
  }

  test("staff and admin screens stay plain", async ({ page }) => {
    for (const path of ["/checkin", "/kitchen", "/admin"]) {
      await page.goto(path);
      await expect(page.locator("[data-theme-pattern]"), path).toHaveCount(0);
    }
  });
});
