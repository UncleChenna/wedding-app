import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { listThemes } from "../src/modules/theming";

/**
 * Base component accessibility (TICKET-017): keyboard-only Sheet use, 44px tap
 * targets and an axe scan of /dev/theme, which renders every theme at once.
 */
test.describe("base components @smoke", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.skip(({ isMobile }) => !isMobile, "Phone-first checks run in the mobile project");

  test("Sheet traps focus, closes on Escape and returns focus to its trigger", async ({ page }) => {
    await page.goto("/dev/theme");
    for (const theme of listThemes()) {
      const section = page.getByTestId(`theme-${theme.id}`);
      const trigger = section.getByRole("button", { name: "Open sheet" });
      await trigger.focus();
      await page.keyboard.press("Enter");

      const sheet = page.getByRole("dialog", { name: "Your order" });
      await expect(sheet).toBeVisible();
      // Bottom sheet on phones: it sits at the bottom edge of the viewport.
      const box = await sheet.boundingBox();
      expect(box && Math.round(box.y + box.height)).toBe(812);

      // Tab cycles within the dialog, never back to the page behind it.
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        const inside = await sheet.evaluate((dialog) => dialog.contains(document.activeElement));
        expect(inside).toBe(true);
      }

      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test("every control on /dev/theme is at least 44×44px", async ({ page }) => {
    await page.goto("/dev/theme");
    const small = await page
      .locator("main button:visible, main input:visible, main a[href]:visible")
      .evaluateAll((elements) =>
        elements
          .map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return {
              label: el.getAttribute("aria-label") ?? el.textContent?.trim(),
              width,
              height,
            };
          })
          .filter(({ width, height }) => width < 44 || height < 44),
      );
    expect(small).toEqual([]);
  });

  test("staff status panels read at arm's length in every theme (TICKET-019)", async ({ page }) => {
    await page.goto("/dev/theme");
    for (const theme of listThemes()) {
      const staff = page.getByTestId(`theme-${theme.id}`).getByTestId("staff-status");
      for (const label of ["Valid", "Already used", "Not RSVP'd", "Invalid", "Revoked"]) {
        // exact: "Valid" must not also match "Invalid".
        const panel = staff.getByRole("region", { name: label, exact: true });
        await expect(panel).toBeVisible();
        await expect(panel.getByRole("img", { name: `${label} icon`, exact: true })).toBeVisible();
        const sizes = await panel.evaluate((el) =>
          [...el.querySelectorAll("p")].map((p) => parseFloat(getComputedStyle(p).fontSize)),
        );
        const [labelSize = 0, identifierSize = 0, detailSize = 0] = sizes;
        expect(identifierSize).toBeGreaterThanOrEqual(32);
        expect(Math.min(labelSize, detailSize)).toBeGreaterThanOrEqual(18);
      }
    }
  });

  test("axe finds no violations on /dev/theme, with the Sheet closed and open", async ({
    page,
  }) => {
    await page.goto("/dev/theme");
    // Scan the settled page: mid-fade text has partial opacity and would be measured wrongly.
    // Infinite animations (the loading spinner) never finish, so wait only for finite ones.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished),
      ),
    );
    const closed = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      closed.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
    ).toEqual([]);

    const first = listThemes()[0];
    if (!first) throw new Error("no themes registered");
    await page.getByTestId(`theme-${first.id}`).getByRole("button", { name: "Open sheet" }).click();
    await expect(page.getByRole("dialog", { name: "Your order" })).toBeVisible();
    const open = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      open.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
    ).toEqual([]);
  });
});
