import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";

for (const theme of listThemes()) {
  for (const width of [375, 768, 1280]) {
    test(`@smoke delayed fonts preserve invitation origins: ${theme.id} ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ("hadRecentInput" in entry && !entry.hadRecentInput && "value" in entry) {
              cls += Number(entry.value);
              document.documentElement.dataset.fontSwapCls = String(cls);
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      let releaseFonts = () => {};
      const fonts = new Promise<void>((resolve) => {
        releaseFonts = resolve;
      });
      await page.route("**/*.woff2", async (route) => {
        await fonts;
        await route.continue();
      });
      await page.goto(`/dev/invitation/letter?theme=${theme.id}`, {
        waitUntil: "domcontentloaded",
      });
      const names = page.locator('h1 span, nav[aria-label="Preview theme"] a');
      await expect(names).toHaveCount(7);
      const origins = () =>
        names.evaluateAll((elements) =>
          elements.map((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const { x, y } = range.getBoundingClientRect();
            return { x, y };
          }),
        );
      try {
        await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loading");
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        const before = await origins();
        releaseFonts();
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        expect(await origins()).toEqual(before);
        expect((await page.locator("html").getAttribute("data-font-swap-cls")) ?? "0").toBe("0");
      } finally {
        releaseFonts();
      }
    });
  }
}
