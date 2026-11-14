import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const route of ["/", "/missing-layout-proof", "/checkin"]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`shared placeholder ${route} ${colorScheme} has no cold-load shift`, async ({
      page,
    }, testInfo) => {
      if (testInfo.project.name === "mobile")
        await page.setViewportSize({ width: 375, height: 812 });
      await page.emulateMedia({ colorScheme });
      await page.route("**/*.woff2", async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        await request.continue();
      });
      await page.addInitScript(() => {
        const state = window as unknown as { placeholderCls: number; placeholderShifts: unknown[] };
        state.placeholderCls = 0;
        state.placeholderShifts = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
              sources: {
                node?: Node;
                previousRect: DOMRectReadOnly;
                currentRect: DOMRectReadOnly;
              }[];
            };
            if (!shift.hadRecentInput) {
              state.placeholderCls += shift.value;
              state.placeholderShifts.push({
                value: shift.value,
                sources: shift.sources.map((source) => ({
                  node: source.node?.nodeName,
                  text: source.node?.textContent?.slice(0, 80),
                  before: source.previousRect.toJSON(),
                  after: source.currentRect.toJSON(),
                })),
              });
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");
      const result = await page.evaluate(() => {
        const state = window as unknown as { placeholderCls: number; placeholderShifts: unknown[] };
        return { cls: state.placeholderCls, shifts: state.placeholderShifts };
      });
      expect(result.cls, JSON.stringify(result.shifts)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      const directory = process.env.PLACEHOLDER_REVIEW_DIR ?? "artifacts/TICKET-121/placeholders";
      await mkdir(directory, { recursive: true });
      await page.screenshot({
        path: join(
          directory,
          `${route.slice(1) || "home"}-${colorScheme}-${testInfo.project.name}.png`,
        ),
        fullPage: true,
      });
    });
  }
}
