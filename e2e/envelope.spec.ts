import { expect, test } from "@playwright/test";
import { listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";

for (const theme of listThemes()) {
  test(`@smoke envelope first visit, replay and return: ${theme.id}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      document.addEventListener("animationstart", (event) => {
        const target = event.target;
        if (!(target instanceof Element) || !target.closest("[data-envelope]")) return;
        document.documentElement.dataset.envelopeAnimated = "true";
      });
    });
    await page.goto(`/dev/invitation/letter?theme=${theme.id}`);
    await expect(page.locator("html")).toHaveAttribute("data-envelope-animated", "true");
    const replay = page.getByRole("button", { name: "Replay opening" });
    await expect(replay).toBeVisible();
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 100));
    await replay.click();
    const envelope = page.locator("[data-envelope]");
    await expect(envelope).toHaveAttribute("data-opening", "true");
    expect(
      await envelope
        .getByRole("button")
        .evaluate((element) => getComputedStyle(element).transitionDuration),
    ).toBe("0.18s");
    const animations = await envelope
      .locator("[aria-hidden]")
      .first()
      .evaluate((element) =>
        element.getAnimations({ subtree: true }).map((animation) => {
          animation.pause();
          const effect = animation.effect as KeyframeEffect;
          return {
            duration: effect.getTiming().duration,
            properties: [
              ...new Set(
                effect
                  .getKeyframes()
                  .flatMap((frame) =>
                    Object.keys(frame).filter(
                      (key) => !["offset", "computedOffset", "easing", "composite"].includes(key),
                    ),
                  ),
              ),
            ],
          };
        }),
      );
    expect(animations).toHaveLength(2);
    for (const animation of animations) {
      expect(animation.duration).toBe(600);
      expect(animation.properties.every((key) => ["opacity", "transform"].includes(key))).toBe(
        true,
      );
    }
    await page.getByRole("link", { name: "Kindly reply" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#reply")).toBeFocused();
    await expect(page.getByRole("link", { name: "Try RSVP preview" })).toBeInViewport();
    await expect(envelope).toHaveAttribute("data-opening", "true");
    await page.clock.runFor(600);
    await expect(replay).toBeVisible();
    await replay.focus();
    await page.keyboard.press("Enter");
    const skip = page.getByRole("button", { name: "Skip opening" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(replay).toBeFocused();
    await page.clock.resume();
    await page.reload();
    await expect(replay).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-envelope-animated", "true");
  });
  for (const width of [375, 768, 1280]) {
    test(`@smoke envelope reduced motion ${theme.id} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/dev/invitation/letter?theme=${theme.id}`);
      const envelope = page.locator("[data-envelope]");
      await expect(envelope).toHaveAttribute("data-opening", "false");
      expect(
        await envelope.evaluate((element) => element.getAnimations({ subtree: true }).length),
      ).toBe(0);
      await expect(page.getByRole("button", { name: /opening/ })).toHaveCount(0);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `artifacts/TICKET-039/${theme.id}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
test("@smoke invitation remains usable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto("/dev/invitation/letter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Uchenna & Adaora");
  await page.getByRole("link", { name: "Kindly reply" }).click();
  await expect(page.getByRole("link", { name: "Try RSVP preview" })).toBeInViewport();
  await expect(page.getByRole("button", { name: /opening/ })).toHaveCount(0);
  await context.close();
});
