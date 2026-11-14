import { expect, test } from "@playwright/test";

for (const colorScheme of ["light", "dark"] as const) {
  test(`bundled fonts render without JavaScript in ${colorScheme} mode @smoke`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      colorScheme,
      viewport: { width: 375, height: 900 },
    });
    const page = await context.newPage();
    const externalFonts: string[] = [];
    const localFonts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() !== "font") return;
      const url = new URL(request.url());
      if (url.origin !== new URL(baseURL ?? "http://localhost").origin)
        externalFonts.push(request.url());
      else localFonts.push(request.url());
    });
    try {
      await page.goto("/dev/theme");
      await page.evaluate(() => document.fonts.ready);
      expect(externalFonts).toEqual([]);
      expect(localFonts.length).toBeGreaterThanOrEqual(4);
      const loaded = await page.evaluate(() =>
        [...document.fonts].filter((font) => font.status === "loaded").map((font) => font.family),
      );
      for (const family of ["cormorant", "inter", "jost", "playfair"]) {
        expect(
          loaded.some((name) => name.toLowerCase().includes(family)),
          family,
        ).toBe(true);
      }
      await expect(
        page.getByTestId("theme-ivory-gold").getByText("Uchenna & Adaora", { exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    } finally {
      await context.close();
    }
  });
}

test("Latin pages avoid complete font downloads but other characters still load them @smoke", async ({
  page,
}) => {
  const fontUrls: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fontUrls.push(request.url());
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(fontUrls.length).toBeGreaterThan(0);
  expect(fontUrls.every((url) => url.includes("common"))).toBe(true);
  await page.evaluate(async () => {
    const probe = document.createElement("span");
    probe.style.fontFamily = "var(--font-inter)";
    probe.textContent = "Ọgbọnọ · Crème brûlée";
    document.body.append(probe);
    await document.fonts.load("32px " + getComputedStyle(probe).fontFamily, probe.textContent);
    await document.fonts.ready;
  });
  expect(fontUrls.some((url) => /\/inter_common\./.test(url))).toBe(true);
  expect(fontUrls.some((url) => /\/inter\./.test(url))).toBe(false);
  await page.evaluate(async () => {
    const probe = document.createElement("span");
    probe.style.fontFamily = "var(--font-inter)";
    probe.style.fontSize = "32px";
    probe.textContent = "Ж";
    document.body.append(probe);
    await document.fonts.load("32px " + getComputedStyle(probe).fontFamily, "Ж");
    await document.fonts.ready;
  });
  expect(fontUrls.some((url) => /\/inter\./.test(url))).toBe(true);
});

test("subset glyphs match complete fonts at every approved weight @smoke", async ({ page }) => {
  await page.goto("/dev/theme");
  const results = await page.evaluate(async () => {
    const faces = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule);
    const sourceUrl = (face: CSSFontFaceRule) => {
      const match = /url\(["']?([^"')]+)["']?\)/.exec(face.style.getPropertyValue("src"));
      if (!match?.[1]) throw new Error("Missing font URL");
      return "url(" + new URL(match[1], face.parentStyleSheet?.href ?? location.href).href + ")";
    };
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 100;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas unavailable");
    const results = [];
    for (const name of ["cormorant", "cormorant_italic", "inter", "jost", "playfair"]) {
      const full = faces.find((face) =>
        face.style.getPropertyValue("src").includes("/" + name + "."),
      );
      const latin = faces.find((face) =>
        face.style.getPropertyValue("src").includes("/" + name + "_common."),
      );
      if (!full || !latin) throw new Error("Missing font pair: " + name);
      const style = name.includes("italic") ? "italic" : "normal";
      const weightRange = full.style.getPropertyValue("font-weight");
      const original = new FontFace("Original" + name, sourceUrl(full), {
        weight: weightRange,
        style,
      });
      const subset = new FontFace("Subset" + name, sourceUrl(latin), {
        weight: weightRange,
        style,
      });
      document.fonts.add(await original.load());
      document.fonts.add(await subset.load());
      const family = name.split("_")[0];
      const probe = document.createElement("span");
      probe.style.fontFamily = "var(--font-" + family + ")";
      document.body.append(probe);
      const actualFamily = getComputedStyle(probe).fontFamily;
      for (const copy of ["Aaé’& Uchenna", "Ọgbọnọ · Crème", "ỊịỌọỤụ ṄṅŃń", "Ā"]) {
        for (const weight of [400, 500, 600]) {
          await document.fonts.load(style + " " + weight + " 48px " + actualFamily, copy);
          const draw = (family: string) => {
            ctx.clearRect(0, 0, 500, 100);
            ctx.font = style + " " + weight + " 48px " + family;
            ctx.fillText(copy, 10, 70);
            return {
              width: ctx.measureText(copy).width,
              pixels: ctx.getImageData(0, 0, 500, 100).data,
            };
          };
          const a = draw("Original" + name + "," + actualFamily),
            b = draw(copy === "Aaé’& Uchenna" ? "Subset" + name : actualFamily);
          results.push({
            name,
            copy,
            weight,
            widthEqual: a.width === b.width,
            pixelsEqual: a.pixels.every((value, index) => value === b.pixels[index]),
          });
        }
      }
      probe.remove();
      document.fonts.delete(original);
      document.fonts.delete(subset);
    }
    return results;
  });
  expect(results).toHaveLength(60);
  for (const result of results) {
    expect
      .soft(result.widthEqual, result.name + " " + result.weight + " " + result.copy)
      .toBe(true);
    expect
      .soft(result.pixelsEqual, result.name + " " + result.weight + " " + result.copy)
      .toBe(true);
  }
});
