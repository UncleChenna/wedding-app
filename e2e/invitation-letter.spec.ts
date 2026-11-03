import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";

for (const theme of listThemes())
  for (const width of [375, 768, 1280]) {
    test(`@smoke personal invitation letter ${theme.id} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/dev/invitation/letter?theme=${theme.id}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Uchenna & Adaora");
      await expect(page.getByText("Venue to follow")).toBeVisible();
      await expect(page.getByText("Dress code to follow")).toBeVisible();
      await expect(page.getByRole("link", { name: "View the venue" })).toHaveCount(0);
      expect(await scanA11y(page)).toEqual([]);
      for (const link of await page.getByRole("link").all()) {
        const rect = await link.boundingBox();
        expect(rect?.height).toBeGreaterThanOrEqual(44);
        expect(rect?.width).toBeGreaterThanOrEqual(44);
      }
      await page.getByRole("link", { name: "Kindly reply" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#reply")).toBeFocused();
      await expect(page.getByRole("link", { name: "Try RSVP preview" })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `artifacts/TICKET-037/${theme.id}-${width}.png`,
        fullPage: true,
      });
      await page.getByRole("heading", { level: 1 }).evaluate((el) => {
        el.textContent = "A".repeat(80);
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
test("@smoke configured sample maps are labelled and use an HTTPS destination", async ({
  page,
}) => {
  await page.goto("/dev/invitation/letter?details=sample");
  await expect(page.getByText(/not the wedding arrangements/)).toBeVisible();
  const map = page.getByRole("link", { name: "View the venue" });
  await expect(map).toHaveAttribute(
    "href",
    "https://www.google.com/maps/search/?api=1&query=Kew+Gardens+London",
  );
  await expect(map).toHaveAttribute("referrerpolicy", "no-referrer");
});
