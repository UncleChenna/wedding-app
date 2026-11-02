import { waitForPublicDestination } from "./support/routes";
import { expect, test } from "@playwright/test";

import { getActiveThemes } from "../src/modules/theming";
import { ALL_ROUTES } from "./support/routes";

const hexToRgb = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Each guest sees the theme that matches their device setting (TICKET-204): Ivory & Gold in
 * light mode, Midnight & Champagne in dark mode, straight from the server HTML.
 */
test.describe("device colour scheme @smoke", () => {
  const themes = getActiveThemes();

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "colour-scheme checks run on the phone project");
  });

  for (const colorScheme of ["light", "dark"] as const) {
    const theme = themes[colorScheme];

    for (const route of ALL_ROUTES) {
      test(`${route} renders ${theme.id} in ${colorScheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(route);
        await waitForPublicDestination(page, route);
        const rendered = await page.evaluate(() => ({
          background: getComputedStyle(document.body).backgroundColor,
          text: getComputedStyle(document.body).color,
          scheme: getComputedStyle(document.documentElement).colorScheme,
          inlineVars: [...document.documentElement.style].filter((key) => key.startsWith("--t-")),
        }));
        expect(rendered.background).toBe(hexToRgb(theme.colors.background));
        expect(rendered.text).toBe(hexToRgb(theme.colors.foreground));
        expect(rendered.scheme).toBe(colorScheme);
        // Inline variables would beat the media query and pin one theme.
        expect(rendered.inlineVars).toEqual([]);
      });
    }
  }

  test("the server HTML carries both themes and a browser-bar colour for each", async ({
    page,
    request,
  }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain(`--t-color-background: ${themes.light.colors.background};`);
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    expect(html).toContain(`--t-color-background: ${themes.dark.colors.background};`);

    await page.goto("/");
    for (const scheme of ["light", "dark"] as const) {
      const meta = page.locator(
        `meta[name="theme-color"][media="(prefers-color-scheme: ${scheme})"]`,
      );
      await expect(meta).toHaveAttribute("content", themes[scheme].colors.background);
    }
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
      "content",
      "light dark",
    );
  });

  test("the page follows a live switch of the device setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(await background()).toBe(hexToRgb(themes.light.colors.background));
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await background()).toBe(hexToRgb(themes.dark.colors.background));
  });
});
