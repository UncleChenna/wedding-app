import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { listThemes } from "../../src/modules/theming";
import { appRoutes } from "../../src/modules/shared/lib/routes";
import { applyTheme } from "./theme";
import { settleAnimations } from "./axe";

export async function reviewAdminJourneys(page: Page, household: string) {
  if (process.env.CAPTURE_JOURNEY_REVIEW !== "1") return;
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of listThemes())
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const dir = `docs/reviews/TICKET-209/admin/${theme.id}/${width}`;
      mkdirSync(dir, { recursive: true });
      for (const state of ["hub", "sharing", "dialog"]) {
        if (state !== "dialog")
          await page.goto(state === "hub" ? appRoutes.admin.path : appRoutes.adminSharing.path);
        await applyTheme(page, theme);
        if (state === "dialog") {
          await page
            .locator("li")
            .filter({ has: page.getByRole("heading", { name: household, exact: true }) })
            .getByRole("button", { name: "Share invitation" })
            .click();
          await expect(page.getByRole("dialog")).toBeVisible();
        }
        await settleAnimations(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(
          (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
            .violations,
        ).toEqual([]);
        await page.screenshot({ path: `${dir}/${state}.png`, fullPage: true });
        if (state === "dialog") await page.keyboard.press("Escape");
      }
    }
}
