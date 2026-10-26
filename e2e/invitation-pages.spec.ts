import { expect, test } from "@playwright/test";
import { scanA11y } from "./support/axe";
import { listThemes } from "../src/modules/theming";
import { applyTheme } from "./support/theme";

test("@smoke home provides invitation guidance and preview navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Uchenna");
  await page.getByRole("link", { name: "Your invitation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "An invitation just for you" })).toBeVisible();
  await page.getByRole("link", { name: "Back to our day" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dev");
  await page.getByRole("link", { name: "Invitation preview", exact: true }).click();
  await page.getByRole("link", { name: "About your RSVP" }).click();
  await expect(page.getByText(/This preview does not send an RSVP/)).toBeVisible();
  await expect(page.getByRole("link", { name: "View the venue" })).toHaveAttribute(
    "href",
    /maps\/search/,
  );
});

for (const theme of listThemes()) {
  for (const width of [375, 768, 1280]) {
    test(`@smoke ${theme.id} ${width}: accessible, responsive pages and long names`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/invite", "/dev", `/dev/invitation?theme=${theme.id}`]) {
        await page.goto(route);
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const link of await page.getByRole("link").all()) {
          const box = await link.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box?.width).toBeGreaterThanOrEqual(44);
        }
        await page.locator("body").evaluate((body) => {
          body.tabIndex = -1;
          body.focus();
        });
        await page.keyboard.press("Tab");
        await expect(page.locator(":focus")).toHaveCount(1);
        await page.locator("img").evaluateAll(async (images) => {
          await Promise.all(
            images.map((image) =>
              image instanceof HTMLImageElement ? image.decode() : Promise.resolve(),
            ),
          );
        });
        await page.screenshot({
          path: `artifacts/invitation/${theme.id}-${width}-${(route.split("?")[0] ?? "home").replaceAll("/", "_") || "home"}.png`,
          fullPage: true,
        });
      }
      await page.getByRole("heading", { level: 1 }).evaluate((heading) => {
        heading.textContent = "A".repeat(80);
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
}
