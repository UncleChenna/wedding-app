import { expect, test } from "@playwright/test";

import { getTheme } from "../src/modules/theming";
import { applyTheme } from "./support/theme";

for (const id of ["midnight-champagne", "ivory-gold"]) {
  test(`@smoke theme helper settles button colours in ${id}`, async ({ page }) => {
    await page.goto("/offline");
    const initial = getTheme(id === "ivory-gold" ? "midnight-champagne" : "ivory-gold");
    await applyTheme(page, initial);
    const button = page.getByRole("button", { name: "Try again" });
    await button.evaluate(async (element) => {
      await Promise.all(document.getAnimations().map((animation) => animation.finished));
      // Amplify the real transition in this fixture so a fast machine cannot hide the race.
      element.style.transitionDuration = "1s";
      void getComputedStyle(element).backgroundColor;
    });
    const theme = getTheme(id);
    await applyTheme(page, theme);
    const actual = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
    const rgb = theme.colors.primary.match(/[a-f\d]{2}/gi)?.map((part) => parseInt(part, 16));
    expect(actual).toBe(`rgb(${rgb?.join(", ")})`);
  });
}
