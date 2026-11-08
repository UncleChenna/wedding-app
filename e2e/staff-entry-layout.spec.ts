import { expect, test } from "@playwright/test";

for (const route of ["/checkin", "/kitchen", "/bar"]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`staff entry ${route} ${colorScheme} has no cold-load shift`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.route("**/*.woff2", async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await request.continue();
      });
      await page.addInitScript(() => {
        const state = window as unknown as { staffCls: number; staffShifts: unknown[] };
        state.staffCls = 0;
        state.staffShifts = [];
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
              state.staffCls += shift.value;
              state.staffShifts.push({
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
      await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");
      const result = await page.evaluate(() => {
        const state = window as unknown as { staffCls: number; staffShifts: unknown[] };
        return { cls: state.staffCls, shifts: state.staffShifts };
      });
      expect(result.cls, JSON.stringify(result.shifts)).toBe(0);
    });
  }
}
