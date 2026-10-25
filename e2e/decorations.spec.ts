import { expect, test } from "@playwright/test";

import { listThemes } from "../src/modules/theming";

/** Theme-driven divider, monogram and paper texture (TICKET-020), checked in every theme. */
test.describe("decorations on /dev/theme @smoke", () => {
  for (const theme of listThemes()) {
    test(`${theme.id}: decorations follow the theme's tokens`, async ({ page }) => {
      await page.goto("/dev/theme");
      const section = page.getByTestId(`theme-${theme.id}`).getByTestId("decorations");
      await expect(section.getByRole("img", { name: "A & G monogram" })).toBeVisible();
      await expect(section.getByRole("separator")).toHaveCount(2);

      const texture = await section.locator("[data-paper-texture]").evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          mask: s.maskImage || s.getPropertyValue("-webkit-mask-image"),
          opacity: Number(s.opacity),
          pointerEvents: s.pointerEvents,
        };
      });
      expect(texture.pointerEvents).toBe("none");
      if (theme.pattern) {
        expect(texture.mask).toContain(theme.pattern.src);
        expect(texture.opacity).toBeCloseTo(theme.pattern.strength, 3);
      } else {
        expect(texture.opacity).toBe(0);
      }

      // Monogram ring and ornament use the theme's primary; the hairline uses its border token.
      const colours = await section.evaluate((root) => {
        const probe = document.createElement("span");
        root.append(probe);
        probe.style.color = "var(--t-color-primary)";
        const primary = getComputedStyle(probe).color;
        probe.style.color = "var(--t-color-border)";
        const border = getComputedStyle(probe).color;
        probe.remove();
        const ring = root.querySelector('[role="img"]');
        const line = root.querySelector('[data-variant="guest"] span');
        return {
          primary,
          border,
          ring: ring ? getComputedStyle(ring).borderTopColor : "",
          line: line ? getComputedStyle(line).backgroundColor : "",
        };
      });
      expect(colours.ring).toBe(colours.primary);
      expect(colours.line).toBe(colours.border);
    });
  }
});
