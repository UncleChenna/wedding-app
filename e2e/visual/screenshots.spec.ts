/**
 * Full-page screenshots of routes × themes × widths, for the ui-reviewer agent.
 *
 *   pnpm screenshots                                   # default routes
 *   SCREENSHOT_ROUTES=/,/invite pnpm screenshots       # custom routes
 *
 * Output: artifacts/screenshots/<theme>/<width>/<route>.png (+ <route>.part-N.png
 * viewport-height slices for long pages)
 * Each theme is applied by overriding the theme variables on <html>, so pages
 * can be reviewed in every theme without changing the active theme.
 */
import { expect, test } from "@playwright/test";

import { listThemes, themeToCssVars } from "../../src/modules/theming";

const WIDTHS = [375, 768, 1280] as const;
const SLICE_HEIGHT = 900;
const ROUTES = (process.env.SCREENSHOT_ROUTES ?? "/,/dev/theme")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

const slug = (route: string) =>
  route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");

for (const theme of listThemes()) {
  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      test(`${theme.id} @ ${width}px ${route}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.evaluate(
          ({ vars, scheme, id }) => {
            const root = document.documentElement;
            for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
            root.style.colorScheme = scheme;
            root.dataset.theme = id;
          },
          { vars: themeToCssVars(theme), scheme: theme.colorScheme, id: theme.id },
        );
        await page.evaluate(() => document.fonts.ready);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect.soft(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);

        const dir = `artifacts/screenshots/${theme.id}/${width}`;
        await page.screenshot({ path: `${dir}/${slug(route)}.png`, fullPage: true });

        // Long pages shrink too much to inspect as one image, so also save
        // viewport-height slices: <route>.part-1.png, part-2, ...
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        if (height > SLICE_HEIGHT * 1.5) {
          for (let i = 0; i * SLICE_HEIGHT < height; i++) {
            await page.screenshot({
              path: `${dir}/${slug(route)}.part-${i + 1}.png`,
              fullPage: true,
              clip: {
                x: 0,
                y: i * SLICE_HEIGHT,
                width,
                height: Math.min(SLICE_HEIGHT, height - i * SLICE_HEIGHT),
              },
            });
          }
        }
      });
    }
  }
}
