import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { listThemes, themeToCssVars } from "../src/modules/theming";
import { applyTheme } from "./support/theme";

for (const theme of listThemes()) {
  test(`fonts load on demand for ${theme.id}`, async ({ page }, info) => {
    const fonts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "font") fonts.push(request.url());
    });
    await page.setViewportSize({ width: 375, height: 900 });
    // Boot with the registered Jost-based dark theme, then apply the selected
    // theme at the root as real active-theme selection does. The preview's
    // scoped styles alone cannot change the body's inherited font family.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(`/dev/invitation/letter?theme=${theme.id}`);
    // Install the selected variables before switching the emulated scheme;
    // otherwise the default light theme briefly requests its own Inter face.
    await page.evaluate((vars) => {
      for (const [key, value] of Object.entries(vars))
        document.documentElement.style.setProperty(key, value);
    }, themeToCssVars(theme));
    await applyTheme(page, theme);
    const preloads = await page
      .locator('link[rel="preload"][as="font"]')
      .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
    expect(preloads.filter((url) => /\/inter(?:_latin)?\./.test(url))).toEqual([]);
    expect(fonts.some((url) => /\/inter_latin\./.test(url))).toBe(theme.fonts.body === "inter");
    for (const family of [theme.fonts.display, theme.fonts.body]) {
      expect(
        fonts.some((url) => url.includes(`/${family}_latin.`)),
        family,
      ).toBe(true);
    }
    // Real accented and Igbo text must still request its complete body face.
    const sample = await page
      .getByText("Dear Amara,", { exact: true })
      .evaluate(async (element) => {
        element.textContent = "Dear Chịọma and Adaọra — café,";
        const family = getComputedStyle(element).fontFamily;
        await document.fonts.load(`20px ${family}`, element.textContent);
        await document.fonts.ready;
        return family;
      });
    expect(sample.toLowerCase()).toContain(theme.fonts.body);
    expect(fonts.some((url) => url.includes(`/${theme.fonts.body}.`))).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const transfers = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes(".woff2"))
        .map((entry) => {
          const resource = entry as PerformanceResourceTiming;
          return {
            url: resource.name,
            transferSize: resource.transferSize,
            encodedBodySize: resource.encodedBodySize,
          };
        }),
    );
    await info.attach("font-network", {
      body: JSON.stringify({ theme: theme.id, preloads, fonts, transfers }, null, 2),
      contentType: "application/json",
    });
    await mkdir("artifacts/TICKET-244", { recursive: true });
    await writeFile(
      `artifacts/TICKET-244/${theme.id}.json`,
      JSON.stringify({ theme: theme.id, preloads, fonts, transfers }, null, 2) + "\n",
    );
    const photo = page.locator("img").first();
    await photo.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        photo.evaluate(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await photo.evaluate((image) => {
      if (!(image instanceof HTMLImageElement)) throw new Error("Expected hero image");
      return image.decode();
    });
    await page.screenshot({
      path: `artifacts/TICKET-244/${theme.id}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });
}
