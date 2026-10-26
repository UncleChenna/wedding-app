import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";

test("@smoke stepper preserves draft and focus at both bounds", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/theme");
  await page.evaluate(() => document.fonts.ready);
  mkdirSync("artifacts/stepper", { recursive: true });
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of listThemes()) {
      const form = page.getByTestId(`theme-${theme.id}`).getByTestId("form-controls");
      const input = form.getByRole("spinbutton", { name: "Jollof rice" });
      await input.fill("3");
      await input.press("ArrowUp");
      await expect(input).toHaveValue("4");
      const plus = form.getByRole("button", { name: "Increase Jollof rice" });
      await plus.focus();
      await plus.press("Enter");
      await expect(input).toHaveValue("5");
      await expect(plus).toBeDisabled();
      await expect(input).toBeFocused();
      await input.fill("1");
      await input.press("Tab");
      const minus = form.getByRole("button", { name: "Decrease Jollof rice" });
      await minus.focus();
      await minus.press("Space");
      await expect(input).toHaveValue("0");
      await expect(minus).toBeDisabled();
      await expect(input).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await form.screenshot({
        path: `artifacts/stepper/${theme.id}-${width}-${info.project.name}.png`,
      });
    }
  }
});
