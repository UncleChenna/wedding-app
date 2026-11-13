import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

for (const theme of listThemes())
  for (const width of [375, 768, 1280]) {
    test(`invitation hero ${theme.id} ${width}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const delivered = page.waitForResponse((response) =>
        response.url().includes("/_next/image?"),
      );
      await page.goto(
        process.env.INVITATION_HERO_PATH ?? `/dev/invitation/letter?theme=${theme.id}`,
      );
      if (process.env.INVITATION_HERO_PATH) await applyTheme(page, theme);
      const image = page.locator("[data-invitation-hero] img");
      await expect(image).toHaveAttribute("alt", /stock photograph/);
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const response = await delivered;
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toMatch(/^image\/(webp|avif)/);
      const rect = await image.boundingBox();
      expect(rect?.x).toBe(0);
      expect(rect?.width).toBe(width);
      expect(rect?.height).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(await scanA11y(page)).toEqual([]);
      const folder = `artifacts/TICKET-038/${info.project.name}`;
      mkdirSync(folder, { recursive: true });
      await page
        .locator("[data-invitation-hero]")
        .screenshot({ path: `${folder}/${theme.id}-${width}.png` });
      await page.getByRole("link", { name: /^(Kindly reply|Your reply)$/ }).focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#reply")).toBeFocused();
    });
  }

test("image decode preserves the reserved hero and following content positions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/image?**", async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto(process.env.INVITATION_HERO_PATH ?? "/dev/invitation/letter", {
      waitUntil: "domcontentloaded",
    });
    await page.evaluate(() => document.fonts.ready);
    const hero = page.locator("[data-invitation-hero]");
    const before = await hero.boundingBox();
    const headingBefore = await page.getByRole("heading", { level: 1 }).boundingBox();
    release();
    await expect
      .poll(() =>
        hero
          .locator("img")
          .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    expect(await hero.boundingBox()).toEqual(before);
    expect(await page.getByRole("heading", { level: 1 }).boundingBox()).toEqual(headingBefore);
  } finally {
    release();
  }
});
