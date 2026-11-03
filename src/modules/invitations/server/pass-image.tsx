import "server-only";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { Theme } from "@/modules/theming";
import { qrMatrix, qrPathData, qrViewBoxSize } from "@/modules/shared/lib/qr";

type Glyph = { id: number; path: { toSVG(): string } };
type Position = { xAdvance: number; xOffset: number; yOffset: number };
type Font = {
  unitsPerEm: number;
  layout(text: string): { glyphs: Glyph[]; positions: Position[] };
};
// Next already ships this parser for next/font. Keep its version-sensitive API isolated here:
// actual-font raster tests must pass when upgrading Next. No remote font fallback is allowed.
const bundledFontkit = createRequire(import.meta.url)(
  "next/dist/compiled/@next/font/dist/fontkit",
) as { default: (bytes: Buffer) => Font };
export type PassImageData = { name: string; partySize: number; url: string };

function width(font: Font, text: string, size: number) {
  return (
    (font.layout(text).positions.reduce((total, p) => total + p.xAdvance, 0) * size) /
    font.unitsPerEm
  );
}
function lines(font: Font, text: string, size: number): string[] {
  const result: string[] = [];
  let line = "";
  // Wrap by grapheme as well as whitespace, including a single very long guest name.
  for (const { segment } of new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)) {
    if (line && width(font, line + segment, size) > 936) {
      const space = line.lastIndexOf(" ");
      if (space > 0) {
        result.push(line.slice(0, space));
        line = line.slice(space + 1) + segment;
      } else {
        result.push(line.trimEnd());
        line = segment.trimStart();
      }
    } else line += segment;
  }
  if (line) result.push(line);
  return result;
}
function outlinedText(font: Font, text: string, size: number, baseline: number, color: string) {
  const run = font.layout(text);
  if (run.glyphs.some((glyph) => glyph.id === 0))
    throw new Error("Local font cannot represent pass name");
  const scale = size / font.unitsPerEm;
  let x = (1080 - width(font, text, size)) / 2;
  return run.glyphs
    .map((glyph, index) => {
      const p = run.positions[index];
      if (!p) throw new Error("Invalid local font layout");
      const value =
        '<path fill="' +
        color +
        '" transform="translate(' +
        (x + p.xOffset * scale) +
        " " +
        (baseline - p.yOffset * scale) +
        ") scale(" +
        scale +
        " " +
        -scale +
        ')" d="' +
        glyph.path.toSVG() +
        '"/>';
      x += p.xAdvance * scale;
      return value;
    })
    .join("");
}

export async function renderPassImage(data: PassImageData, theme: Theme) {
  const [displayBytes, bodyBytes] = await Promise.all([
    readFile(join(process.cwd(), "public/share/fonts/" + theme.fonts.display + ".ttf")),
    readFile(join(process.cwd(), "public/share/fonts/" + theme.fonts.body + ".ttf")),
  ]);
  const display = bundledFontkit.default(displayBytes),
    body = bundledFontkit.default(bodyBytes);
  const nameLines = lines(display, data.name.normalize("NFC").replace(/\s+/gu, " ").trim(), 96);
  const matrix = qrMatrix(data.url);
  const side = qrViewBoxSize(matrix),
    moduleSize = Math.floor(900 / side),
    qrSize = side * moduleSize;
  const qrY = 208 + nameLines.length * 112;
  const height = qrY + qrSize + 240;
  const content = [
    outlinedText(body, "YOUR ENTRY PASS", 36, 90, theme.colors.primary),
    ...nameLines.map((line, index) =>
      outlinedText(display, line, 96, 200 + index * 112, theme.colors.foreground),
    ),
    '<g transform="translate(' +
      (1080 - qrSize) / 2 +
      " " +
      qrY +
      ") scale(" +
      moduleSize +
      ')"><rect width="' +
      side +
      '" height="' +
      side +
      '" fill="' +
      theme.colors["qr-paper"] +
      '"/><path fill="' +
      theme.colors["qr-ink"] +
      '" d="' +
      qrPathData(matrix) +
      '"/></g>',
    outlinedText(
      body,
      "Admits " + data.partySize + (data.partySize === 1 ? " guest" : " guests"),
      48,
      qrY + qrSize + 88,
      theme.colors.foreground,
    ),
    outlinedText(body, "Show this at the door.", 48, qrY + qrSize + 160, theme.colors.foreground),
  ].join("");
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="' +
    height +
    '" viewBox="0 0 1080 ' +
    height +
    '"><rect width="1080" height="' +
    height +
    '" fill="' +
    theme.colors.background +
    '"/>' +
    content +
    "</svg>";
  const rendered = new ImageResponse(
    // Rasterization of local vector paths only: no guest text reaches dynamic font lookup.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={"data:image/svg+xml;base64," + Buffer.from(svg).toString("base64")}
      alt=""
      width={1080}
      height={height}
    />,
    { width: 1080, height },
  );
  // Materialize the stream here so rendering errors can become a friendly, private response.
  const bytes = await rendered.arrayBuffer();
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'inline; filename="entry-pass.png"',
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
