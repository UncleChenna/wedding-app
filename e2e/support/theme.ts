import type { Page } from "@playwright/test";

import { themeToCssVars, type Theme } from "../../src/modules/theming";

/**
 * Render the current page in `theme` by overriding the theme variables on <html>, so every
 * theme can be checked without changing the active one. The active theme's variables are
 * cleared first: optional ones (e.g. --t-pattern-*) must not leak into another theme.
 */
export async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(
    ({ vars, scheme, id }) => {
      const root = document.documentElement;
      for (const key of [...root.style]) if (key.startsWith("--t-")) root.style.removeProperty(key);
      for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
      root.style.colorScheme = scheme;
      root.dataset.theme = id;
    },
    { vars: themeToCssVars(theme), scheme: theme.colorScheme, id: theme.id },
  );
  await page.evaluate(() => document.fonts.ready);
}
