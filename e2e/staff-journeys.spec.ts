import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { appRoutes } from "../src/modules/shared/lib/routes";
import { applyTheme } from "./support/theme";
import { settleAnimations } from "./support/axe";

for (const theme of listThemes())
  for (const width of [375, 768, 1280]) {
    test(`staff journey ${theme.id} ${width} @smoke`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const dir = `docs/reviews/TICKET-209/staff/${theme.id}/${width}`;
      mkdirSync(dir, { recursive: true });
      await page.goto(appRoutes.staff.path);
      for (const route of [appRoutes.staff, appRoutes.checkin, appRoutes.kitchen, appRoutes.bar]) {
        if (route.path !== appRoutes.staff.path)
          await page.getByRole("link", { name: route.label, exact: true }).click();
        await expect(page).toHaveURL(new RegExp(route.path + "$"));
        await applyTheme(page, theme);
        await settleAnimations(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        expect(
          await page
            .getByRole("heading", { level: 1 })
            .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
        ).toBeGreaterThanOrEqual(32);
        const sizes = await page
          .locator("main p, main a, header a, header p")
          .evaluateAll((nodes) => nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)));
        expect(sizes.every((size) => size >= 18)).toBe(true);
        const targets = await page.locator("a:visible, button:visible").evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { width: box.width, height: box.height };
          }),
        );
        expect(targets.every((box) => box.width >= 44 && box.height >= 44)).toBe(true);
        await page.screenshot({ path: `${dir}/${route.path.slice(1)}.png`, fullPage: true });
        await page.getByRole("banner").getByRole("link", { name: "Staff home" }).focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/staff$/);
      }
    });
  }
