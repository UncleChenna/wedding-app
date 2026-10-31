import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { assertDatabaseTarget } from "../scripts/database-target";
import { resolveActiveThemes } from "../src/modules/theming";

test("stored theme pairs reach initial HTML and all device sizes", async ({
  browser,
  request,
  baseURL,
}, testInfo) => {
  test.skip(
    process.env.RUN_THEME_DB_TESTS !== "1" || testInfo.project.name !== "mobile",
    "Isolated database opt-in; run with one worker",
  );
  test.setTimeout(180_000);
  process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url, { localOnly: true });
  if (!process.cwd().includes("/.worktrees/TICKET-012"))
    throw new Error("Use the TICKET-012 isolated fixture");
  const sql = postgres(url, { max: 1, connect_timeout: 5 });
  const [original] = await sql<
    { active_theme_id: string; active_dark_theme_id: string }[]
  >`select active_theme_id, active_dark_theme_id from event_settings where id = 1`;
  if (!original) throw new Error("Seed the isolated database first");
  mkdirSync("docs/reviews/TICKET-012/screenshots", { recursive: true });
  try {
    for (const ids of [
      { light: "blush-sage", dark: "emerald-night" },
      { light: "ivory-gold", dark: "midnight-champagne" },
    ]) {
      await sql`update event_settings set active_theme_id = ${ids.light}, active_dark_theme_id = ${ids.dark} where id = 1`;
      const themes = resolveActiveThemes(ids);
      // Direct SQL intentionally uses the documented 30-second revalidation path.
      await expect
        .poll(
          async () =>
            (await (await request.get("/")).text()).includes(
              `--t-color-background: ${themes.light.colors.background};`,
            ),
          { timeout: 60_000, intervals: [1000] },
        )
        .toBe(true);
      for (const scheme of ["light", "dark"] as const) {
        for (const width of [375, 768, 1280]) {
          const context = await browser.newContext({
            baseURL,
            colorScheme: scheme,
            javaScriptEnabled: false,
            viewport: { width, height: 900 },
          });
          const page = await context.newPage();
          await page.goto("/");
          const theme = themes[scheme];
          expect(await page.locator("style[data-theme-styles]").textContent()).toContain(
            `--t-color-background: ${theme.colors.background};`,
          );
          await expect(
            page.locator(`meta[name="theme-color"][media="(prefers-color-scheme: ${scheme})"]`),
          ).toHaveAttribute("content", theme.colors.background);
          const result = await page.evaluate(() => ({
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--t-color-background")
              .trim(),
            overflow: document.documentElement.scrollWidth > innerWidth,
          }));
          expect(result).toEqual({ color: theme.colors.background, overflow: false });
          await page.screenshot({
            path: `docs/reviews/TICKET-012/screenshots/${theme.id}-${width}.png`,
            fullPage: true,
          });
          await context.close();
        }
        const context = await browser.newContext({
          baseURL,
          colorScheme: scheme,
          viewport: { width: 375, height: 900 },
        });
        const page = await context.newPage();
        await page.goto("/");
        await page.locator("main").waitFor();
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(axe.violations).toEqual([]);
        await context.close();
      }
    }
  } finally {
    await sql`update event_settings set active_theme_id = ${original.active_theme_id}, active_dark_theme_id = ${original.active_dark_theme_id} where id = 1`;
    await sql.end();
  }
});
