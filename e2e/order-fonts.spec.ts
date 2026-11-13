import { expect, test } from "@playwright/test";

test("order subsets retain original pixels and complete non-ASCII fallback", async ({ page }) => {
  await page.goto("/order");
  const results = await page.evaluate(async () => {
    const faces = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSFontFaceRule => rule instanceof CSSFontFaceRule);
    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 100;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas unavailable");
    const results = [];
    for (const name of ["cormorant", "inter", "playfair", "jost"]) {
      const full = faces.find(
        (face) =>
          face.style.getPropertyValue("font-family").replaceAll('"', "") ===
          `Order ${name} Complete`,
      );
      const subset = faces.find(
        (face) =>
          face.style.getPropertyValue("font-family").replaceAll('"', "") === `Order ${name}`,
      );
      if (!full || !subset) throw new Error("Missing order font pair");
      const load = async (family: string, rule: CSSFontFaceRule) => {
        const path = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue("src"))?.[1];
        if (!path) throw new Error("Missing font URL");
        const face = new FontFace(family, `url(${new URL(path, location.href).href})`, {
          weight: rule.style.getPropertyValue("font-weight"),
        });
        document.fonts.add(await face.load());
        return face;
      };
      const original = await load(`Original-${name}`, full);
      const small = await load(`Subset-${name}`, subset);
      for (const weight of [400, 500, 600]) {
        const draw = (family: string, copy: string) => {
          ctx.clearRect(0, 0, 700, 100);
          ctx.font = `${weight} 40px ${family}`;
          ctx.fillText(copy, 5, 60);
          return {
            width: ctx.measureText(copy).width,
            pixels: ctx.getImageData(0, 0, 700, 100).data,
          };
        };
        for (const copy of ["Aa& Uchenna ‘Table’ 12 × 2…", "éÀò", "ỊịỌọỤụ", "Ā"]) {
          await document.fonts.load(
            `${weight} 40px "Order ${name}","Order ${name} Complete"`,
            copy,
          );
          const a = draw(`Original-${name}`, copy);
          const b = draw(
            copy !== "Aa& Uchenna ‘Table’ 12 × 2…"
              ? `"Order ${name}","Order ${name} Complete"`
              : `Subset-${name}`,
            copy,
          );
          results.push({
            name,
            weight,
            copy,
            width: a.width === b.width,
            pixels: a.pixels.every((value, index) => value === b.pixels[index]),
          });
        }
      }
      document.fonts.delete(original);
      document.fonts.delete(small);
    }
    return results;
  });
  expect(results).toHaveLength(48);
  for (const result of results) {
    expect(result.width, JSON.stringify(result)).toBe(true);
    expect(result.pixels, JSON.stringify(result)).toBe(true);
  }
});
