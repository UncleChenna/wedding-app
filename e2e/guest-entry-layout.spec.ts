import { expect, test } from "@playwright/test";

for (const colorScheme of ["light", "dark"] as const)
  for (const width of [375, 412, 768, 1280])
    for (const path of ["/", "/invite"]) {
      test(`guest entry ${path} ${colorScheme} ${width} has no cold-font shift`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        await page.route("**/*.woff2", async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await route.continue();
        });
        await page.addInitScript(() => {
          const state = window as unknown as { entryCls: number; entryShifts: unknown[] };
          state.entryCls = 0;
          state.entryShifts = [];
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
                state.entryCls += shift.value;
                state.entryShifts.push({
                  value: shift.value,
                  sources: shift.sources.map((source) => ({
                    text: source.node?.textContent?.slice(0, 100),
                    before: source.previousRect.toJSON(),
                    after: source.currentRect.toJSON(),
                  })),
                });
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
        });
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForLoadState("networkidle");
        const shifts = await page.evaluate(
          () => (window as unknown as { entryShifts: unknown[] }).entryShifts,
        );
        expect(
          await page.evaluate(
            () => (window as unknown as { entryCls: number; entryShifts: unknown[] }).entryCls,
          ),
          JSON.stringify(shifts),
        ).toBe(0);
      });
    }
