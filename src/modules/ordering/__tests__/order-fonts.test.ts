import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("pins generated fonts to their originals and preserves common character coverage and weight axes", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import fs from "node:fs";
    import kit from "next/dist/compiled/@next/font/dist/fontkit/index.js";
    import { createHash } from "node:crypto";
    process.on("uncaughtException", error => { console.error(error.message); process.exit(1); });
    const parse = kit.default || kit;
    const manifest = JSON.parse(fs.readFileSync("src/modules/ordering/fonts/manifest.json"));
    const result = manifest.fonts.map(face => {
      const bytes = fs.readFileSync(face.file);
      const source = fs.readFileSync(face.sourceFile);
      if (createHash("sha256").update(bytes).digest("hex") !== face.sha256 || createHash("sha256").update(source).digest("hex") !== face.sourceSha256) throw new Error("Font manifest drift");
      const original = parse(source), subset = parse(bytes);
      if (JSON.stringify(subset.variationAxes) !== JSON.stringify(original.variationAxes)) throw new Error("Required weight range missing");
      for (const cp of face.codepoints.filter(cp => original.characterSet.includes(cp))) {
        if (!subset.characterSet.includes(cp)) throw new Error("Missing glyph");
      }
      return face.family + ":" + face.variant;
    });
    console.log(JSON.stringify(result));
  `,
    ],
    { encoding: "utf8" },
  );
  expect(JSON.parse(output)).toEqual(
    ["cormorant", "inter", "playfair", "jost"].flatMap((family) => [
      family + ":base",
      family + ":igbo",
    ]),
  );
});
