import { expect, test } from "@playwright/test";

const themes = ["ivory-gold", "midnight-champagne"];

test("motion @smoke uses only opacity/transform with the agreed timings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/dev/theme");
  for (const theme of themes) {
    const showcase = page.getByTestId(`theme-${theme}`).getByTestId("motion-showcase");
    const button = showcase.getByRole("button", { name: "Replay motion" });
    await button.click();
    await expect(showcase).toHaveAttribute("data-replay", "1");
    expect(await button.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe(
      "0.18s",
    );
    for (const [name, duration] of [
      ["fade", 240],
      ["rise", 240],
      ["signature", 600],
    ] as const) {
      const evidence = await showcase.getByTestId(`motion-${name}`).evaluate((node) =>
        node.getAnimations().map((animation) => {
          const effect = animation.effect as KeyframeEffect;
          return {
            duration: effect.getTiming().duration,
            properties: effect
              .getKeyframes()
              .flatMap((frame) =>
                Object.keys(frame).filter(
                  (key) => !["offset", "computedOffset", "easing", "composite"].includes(key),
                ),
              ),
          };
        }),
      );
      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.duration).toBe(duration);
      for (const property of evidence[0]?.properties ?? [])
        expect(["opacity", "transform"]).toContain(property);
    }
    // Replay remains immediately operable while signature motion is running.
    await button.press("Enter");
    await expect(showcase).toHaveAttribute("data-replay", "2");
    await expect(button).toBeFocused();
    const bounds = await button.boundingBox();
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
  }
});

test("motion @smoke removes transforms and animation under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/theme");
  for (const theme of themes) {
    const showcase = page.getByTestId(`theme-${theme}`).getByTestId("motion-showcase");
    await showcase.getByRole("button", { name: "Replay motion" }).click();
    for (const name of ["fade", "rise", "signature"]) {
      const state = await showcase.getByTestId(`motion-${name}`).evaluate((node) => ({
        animations: node.getAnimations().length,
        transform: getComputedStyle(node).transform,
        opacity: getComputedStyle(node).opacity,
      }));
      expect(state).toEqual({ animations: 0, transform: "none", opacity: "1" });
    }
  }
});
