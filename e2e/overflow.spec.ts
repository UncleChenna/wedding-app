import { expect, test } from "@playwright/test";

import { expectedRouteStatus, PAGE_ROUTES as ROUTES } from "./support/routes";

test.describe("no horizontal overflow at 375px @smoke", () => {
  // Pixel 7 (the mobile project) is 412px wide; we design at 375px.
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "375px check runs in the mobile project only");
  });

  for (const path of ROUTES) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "load" });
      expect(response?.status(), path).toBe(expectedRouteStatus(path));

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `${path} scrollWidth vs clientWidth`).toBeLessThanOrEqual(clientWidth);
    });
  }
});
