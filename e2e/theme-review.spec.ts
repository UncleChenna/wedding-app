import { expect, test } from "@playwright/test";

import { contrastRatio } from "../src/modules/theming/lib/contrast";
import { listThemes } from "../src/modules/theming";

/** "rgb(r, g, b)" from getComputedStyle → "#RRGGBB". */
function toHex(rgb: string): string {
  const [r = 0, g = 0, b = 0] = (rgb.match(/\d+/g) ?? []).map(Number);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * UI review regressions for /dev/theme in every preset (TICKET-021): keyboard focus is
 * visible at 3:1 on each theme's page, and long guest names wrap at phone width.
 */
test.describe("theme review on /dev/theme @smoke", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.skip(({ isMobile }) => !isMobile, "Phone-width review runs in the mobile project");

  for (const theme of listThemes()) {
    test(`${theme.id}: every keyboard stop shows a 3:1 focus outline`, async ({ page }) => {
      await page.goto("/dev/theme");
      const section = page.getByTestId(`theme-${theme.id}`);
      // Start just before the section, then Tab through every control inside it.
      await section.evaluate((el) => {
        el.setAttribute("tabindex", "-1");
        el.focus();
      });

      const problems: string[] = [];
      let stops = 0;
      for (let i = 0; i < 80; i++) {
        await page.keyboard.press("Tab");
        const stop = await section.evaluate((root) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || !root.contains(el)) return null;
          // A sheet or toast may open on Enter only; Tab never opens one.
          const s = getComputedStyle(el);
          return {
            name: (el.getAttribute("aria-label") ?? el.textContent ?? el.tagName)
              .trim()
              .slice(0, 40),
            style: s.outlineStyle,
            width: Number.parseFloat(s.outlineWidth),
            colour: s.outlineColor,
            page: getComputedStyle(root).backgroundColor,
          };
        });
        if (!stop) break;
        stops++;
        const ratio = contrastRatio(toHex(stop.colour), toHex(stop.page));
        if (stop.style === "none" || stop.width < 2 || ratio < 3) {
          problems.push(`${stop.name}: ${stop.style} ${stop.width}px ${ratio.toFixed(2)}:1`);
        }
      }
      expect(stops, "keyboard stops in the section").toBeGreaterThan(10);
      expect(problems).toEqual([]);
    });

    test(`${theme.id}: long guest names wrap inside staff panels`, async ({ page }) => {
      await page.goto("/dev/theme");
      const name = page
        .getByTestId(`theme-${theme.id}`)
        .getByText("Oluwaseunfunmilayo Chukwuemeka-Fitzwilliam");
      await expect(name).toBeVisible();
      const fits = await name.evaluate((el) => {
        const panel = el.closest("[role=status], section, div") as HTMLElement;
        return {
          text: el.scrollWidth <= el.clientWidth + 1,
          panel: el.getBoundingClientRect().right <= panel.getBoundingClientRect().right + 1,
          page: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        };
      });
      expect(fits).toEqual({ text: true, panel: true, page: true });
    });
  }
});
