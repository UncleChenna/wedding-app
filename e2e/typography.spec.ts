import { expect, test, type Page } from "@playwright/test";

import { listThemes } from "../src/modules/theming";

/** Typography scale (TICKET-015): computed sizes at 375 and 1280, and no layout shift. */
async function measure(page: Page, themeId: string, className: string) {
  return page
    .getByTestId(`theme-${themeId}`)
    .locator(`[data-type-style="${className}"]`)
    .evaluate((el) => {
      const s = getComputedStyle(el);
      const size = parseFloat(s.fontSize);
      return {
        size,
        lineHeight: parseFloat(s.lineHeight) / size,
        tracking: parseFloat(s.letterSpacing) / size || 0,
        transform: s.textTransform,
      };
    });
}

test.describe("typography scale @smoke", () => {
  for (const [width, minHeading] of [
    [375, 32],
    [1280, 48],
  ] as const) {
    test(`text styles meet the design rules at ${width}px in every theme`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/dev/theme");
      for (const theme of listThemes()) {
        for (const heading of ["type-display", "type-heading"]) {
          const m = await measure(page, theme.id, heading);
          expect(m.size, `${theme.id} ${heading}`).toBeGreaterThanOrEqual(minHeading);
          expect(m.tracking).toBeGreaterThanOrEqual(-0.021);
          expect(m.tracking).toBeLessThanOrEqual(0);
        }
        const body = await measure(page, theme.id, "type-body");
        expect(body.size).toBeGreaterThanOrEqual(16);
        expect(body.lineHeight).toBeGreaterThanOrEqual(1.5);
        expect(body.lineHeight).toBeLessThanOrEqual(1.7);
        const label = await measure(page, theme.id, "type-label");
        expect(label.transform).toBe("uppercase");
        expect(label.tracking).toBeGreaterThanOrEqual(0.079);
        expect(label.tracking).toBeLessThanOrEqual(0.151);
        expect((await measure(page, theme.id, "type-staff")).size).toBeGreaterThanOrEqual(18);
        expect((await measure(page, theme.id, "type-staff-id")).size).toBeGreaterThanOrEqual(32);
      }
    });
  }

  test("loading /dev/theme causes no layout shift (CLS 0)", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/dev/theme");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBe(0);
  });
});
