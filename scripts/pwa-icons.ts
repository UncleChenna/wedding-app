import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { iconThemeIds, startupImages } from "../src/modules/shared/lib/pwa-assets";

const require = createRequire(import.meta.url);
type Glyph = {
  path: { toSVG(): string };
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
};
type Font = {
  layout(text: string): {
    glyphs: Glyph[];
    positions: { xAdvance: number; xOffset: number; yOffset: number }[];
  };
};
type FontParser = (buffer: Buffer) => Font;
const fontkit = require("next/dist/compiled/@next/font/dist/fontkit/index.js") as
  FontParser | { default: FontParser };
const parse = typeof fontkit === "function" ? fontkit : fontkit.default;
type Raster = {
  removeAlpha(): Raster;
  ensureAlpha(): Raster;
  raw(): Raster;
  png(options: { compressionLevel: number; adaptiveFiltering: boolean }): Raster;
  toBuffer(): Promise<Buffer>;
  toBuffer(options: {
    resolveWithObject: true;
  }): Promise<{ data: Buffer; info: { width: number; height: number; channels: number } }>;
};
export const sharp = createRequire(require.resolve("next/package.json"))("sharp") as (
  input: Buffer,
) => Raster;

export async function renderIcon(
  themeId: (typeof iconThemeIds)[number],
  width: number,
  height: number,
  fraction: number,
) {
  const theme = JSON.parse(
    await readFile(resolve("src/modules/theming/themes", themeId + ".json"), "utf8"),
  ) as {
    colors: { background: string; foreground: string; decorative: string };
    fonts: { display: string };
  };
  const font = parse(
    await readFile(resolve("src/modules/theming/fonts", theme.fonts.display + "-latin.woff2")),
  );
  const run = font.layout("UA");
  let advance = 0;
  const parts = run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    if (!position) throw new Error("Missing monogram glyph position");
    const x = advance + position.xOffset;
    advance += position.xAdvance + 30;
    return { glyph, x };
  });
  const minX = Math.min(...parts.map((p) => p.x + p.glyph.bbox.minX));
  const maxX = Math.max(...parts.map((p) => p.x + p.glyph.bbox.maxX));
  const minY = Math.min(...parts.map((p) => p.glyph.bbox.minY));
  const maxY = Math.max(...parts.map((p) => p.glyph.bbox.maxY));
  const scale = (Math.min(width, height) * fraction) / Math.max(maxX - minX, maxY - minY);
  const x = width / 2 - ((minX + maxX) / 2) * scale,
    y = height / 2 + ((minY + maxY) / 2) * scale;
  const paths = parts
    .map((p) => `<path transform="translate(${p.x} 0)" d="${p.glyph.path.toSVG()}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${theme.colors.background}"/><g fill="${theme.colors.foreground}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${paths}</g></svg>`;
  return sharp(Buffer.from(svg))
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toBuffer();
}
export async function generateIcons(root = "public") {
  for (const theme of iconThemeIds) {
    const directory = resolve(root, "icons", theme);
    await mkdir(directory, { recursive: true });
    for (const size of [192, 512])
      for (const purpose of ["any", "maskable"]) {
        await writeFile(
          resolve(directory, `${purpose}-${size}.png`),
          await renderIcon(theme, size, size, purpose === "maskable" ? 0.52 : 0.62),
        );
      }
    await writeFile(
      resolve(directory, "apple-touch-180.png"),
      await renderIcon(theme, 180, 180, 0.62),
    );
    for (const entry of startupImages(theme)) {
      const match = /startup-(\d+)x(\d+)\.png$/.exec(entry.url);
      if (!match?.[1] || !match[2]) throw new Error("Invalid startup size");
      const width = Number(match[1]),
        height = Number(match[2]);
      await writeFile(resolve(root, "." + entry.url), await renderIcon(theme, width, height, 0.22));
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await generateIcons();
  console.log("Generated four themed icon and startup-image sets.");
}
