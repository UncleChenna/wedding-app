import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
test.use({ userAgent: IPHONE });

for (const theme of listThemes())
  for (const width of [375, 768, 1280]) {
    test(`@smoke iOS guide ${theme.id} ${width}: focus, instructions and accessibility`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/checkin");
      await applyTheme(page, theme);
      const trigger = page.getByRole("button", { name: "Add to Home Screen", exact: true });
      await expect(trigger).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Keep us close" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("1. Open Share in Safari")).toBeVisible();
      await expect(dialog.getByText(/Opened this link in WhatsApp/)).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button", { name: "Got it" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const button of await dialog.getByRole("button").all()) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
      if (process.env.RUN_IOS_REVIEW === "1" && testInfo.project.name === "desktop") {
        const dir = `docs/reviews/TICKET-110/${theme.id}/${width}`;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/guide.png" });
      }
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByRole("button", { name: "Got it" }).click();
      await expect(trigger).toBeFocused();
    });
  }

test("@smoke iOS standalone hides the guide", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  await page.goto("/checkin");
  await expect(page.getByRole("heading", { name: "Gate check-in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Home Screen", exact: true })).toHaveCount(
    0,
  );
});

test.describe("marked in-app browser", () => {
  test.use({ userAgent: IPHONE + " WhatsApp/2.26" });
  test("@smoke WhatsApp-marked iOS browser explains opening Safari", async ({ page }) => {
    await page.goto("/checkin");
    await page.getByRole("button", { name: "Add to Home Screen", exact: true }).click();
    await expect(
      page.getByRole("dialog").getByText(/Open this page in Safari first/),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText(/copy the link and paste it into Safari/),
    ).toBeVisible();
  });
});
