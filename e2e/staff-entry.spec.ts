import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

for (const route of ["/checkin", "/kitchen", "/bar"]) {
  test(`staff entry ${route} is readable and operable in all themes @smoke`, async ({ page }) => {
    // This review includes twelve complete accessibility scans and screenshots.
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const field = page.getByLabel("Your six-digit PIN");
    await expect(field).toBeVisible();
    for (const theme of listThemes()) {
      await applyTheme(page, theme);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const form = page.getByRole("form", { name: "Staff sign-in" });
        for (const control of await form.locator('input:not([type="hidden"]), button').all()) {
          const bounds = await control.boundingBox();
          expect(bounds?.height).toBeGreaterThanOrEqual(44);
          expect(bounds?.width).toBeGreaterThanOrEqual(44);
          expect(
            await control.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
          ).toBeGreaterThanOrEqual(18);
        }
        expect(await scanA11y(page)).toEqual([]);
        await page.screenshot({
          path: `artifacts/TICKET-031/screenshots/${theme.id}/${width}/${route.slice(1)}-${test.info().project.name}.png`,
          fullPage: true,
        });
      }
    }
    for (
      let step = 0;
      step < 6 && !(await field.evaluate((element) => element === document.activeElement));
      step++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(field).toBeFocused();
    await page.keyboard.type("012345");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeFocused();
  });
}
