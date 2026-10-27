import { expect, test } from "@playwright/test";

import { PAGE_ROUTES as ROUTES } from "./support/routes";

/**
 * Phone layout on every page in both device colour schemes (TICKET-204): the light and dark
 * themes use different fonts, so text can wrap differently.
 */
test.describe("phone layout at 375px @smoke", () => {
  // Pixel 7 (the mobile project) is 412px wide; we design at 375px.
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "375px check runs in the mobile project only");
  });

  for (const colorScheme of ["light", "dark"] as const) {
    for (const path of ROUTES) {
      test(`${path} in ${colorScheme} mode does not scroll sideways`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        const response = await page.goto(path, { waitUntil: "load" });
        expect(response?.status(), path).toBe(200);
        await page.evaluate(() => document.fonts.ready);

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth, `${path} scrollWidth vs clientWidth`).toBeLessThanOrEqual(clientWidth);
      });

      test(`${path} in ${colorScheme} mode has 44px tap targets`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);

        const small = await page.evaluate(() => {
          const controls = document.querySelectorAll<HTMLElement>(
            "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]",
          );
          const found: string[] = [];
          for (const control of controls) {
            // A radio or checkbox is tapped through its whole label row.
            const target = control.closest("label") ?? control;
            const box = target.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) continue;
            // Links inside a sentence are exempt (WCAG 2.5.8 inline exception).
            const style = getComputedStyle(control);
            const parentText = control.parentElement?.textContent?.trim() ?? "";
            const ownText = control.textContent?.trim() ?? "";
            if (style.display === "inline" && parentText.length > ownText.length) continue;
            if (box.width < 44 || box.height < 44) {
              const name = control.getAttribute("aria-label") ?? ownText;
              found.push(
                `${control.tagName.toLowerCase()} "${name.slice(0, 40)}" ${box.width}×${box.height}`,
              );
            }
          }
          return found;
        });
        expect(small, `${path} controls under 44×44px`).toEqual([]);
      });
    }
  }
});
