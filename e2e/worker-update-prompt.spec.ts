import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { themes } from "../src/modules/theming/themes";
import { WCAG_AA_TAGS } from "./support/axe";

test("update notification is readable and keyboard accessible in every theme", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/theme");
  for (const theme of themes) {
    const selector = `[data-theme="${theme.id}"] [data-update-examples]`;
    const examples = page.locator(selector);
    await expect(examples).toBeVisible();
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await examples.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      expect(await examples.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
      for (const button of await examples.getByRole("button").all()) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
      expect(
        (await new AxeBuilder({ page }).include(selector).withTags(WCAG_AA_TAGS).analyze())
          .violations,
      ).toEqual([]);
      const folder = `docs/reviews/TICKET-111/${info.project.name}`;
      mkdirSync(folder, { recursive: true });
      await examples.screenshot({ path: `${folder}/${theme.id}-${width}.png` });
    }
    const ready = examples.getByRole("complementary", { name: "Site update" }).first();
    await ready.getByRole("button", { name: "Reload", exact: true }).focus();
    await expect(ready.getByRole("button", { name: "Reload", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(ready.getByRole("button", { name: "Later", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
  }
});
