import jsQR from "jsqr";
import { describe, expect, it } from "vitest";

import { hexToRgb } from "@/modules/theming/lib/contrast";
import { themes } from "@/modules/theming/themes";

import { QR_QUIET_ZONE, qrMatrix, qrPathData, qrViewBoxSize, type QrMatrix } from "../lib/qr";

// Realistic length for a signed gate pass URL (TICKET-056 defines the real format).
const PASS =
  "https://wedding.example/p/eyJ2IjoxLCJpbnYiOiJpbnZfOGs0bTJ4IiwicCI6Mn0.MEUCIQD3pQx7Zr9nW1vYH5kTq2LsA8cJdF0eRgUoBiNtPmXwVhIgK4sZ";

/** Rasterise like a phone screen would show it: quiet zone included, 4px per module. */
function rasterise(matrix: QrMatrix, ink: string, paper: string, scale = 4) {
  const side = qrViewBoxSize(matrix) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4);
  const [inkRgb, paperRgb] = [hexToRgb(ink), hexToRgb(paper)];
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const row = Math.floor(y / scale) - QR_QUIET_ZONE;
      const col = Math.floor(x / scale) - QR_QUIET_ZONE;
      const inside = row >= 0 && col >= 0 && row < matrix.size && col < matrix.size;
      const [r, g, b] = inside && matrix.dark[row * matrix.size + col] ? inkRgb : paperRgb;
      pixels.set([r, g, b, 255], (y * side + x) * 4);
    }
  }
  return { pixels, side };
}

describe("qrMatrix", () => {
  const matrix = qrMatrix(PASS);

  it("produces a square grid of modules", () => {
    expect(matrix.dark).toHaveLength(matrix.size * matrix.size);
    expect(matrix.size).toBeGreaterThanOrEqual(21);
  });

  it("keeps a four-module quiet zone on every side", () => {
    const coords = [...qrPathData(matrix).matchAll(/M(\d+) (\d+)/g)].flatMap((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    expect(Math.min(...coords)).toBe(QR_QUIET_ZONE);
    expect(Math.max(...coords)).toBe(QR_QUIET_ZONE + matrix.size - 1);
    expect(qrViewBoxSize(matrix)).toBe(matrix.size + 2 * QR_QUIET_ZONE);
  });

  it.each(themes.map((theme) => [theme.id, theme] as const))(
    "decodes back to the pass in %s colours",
    (_id, theme) => {
      const { pixels, side } = rasterise(matrix, theme.colors["qr-ink"], theme.colors["qr-paper"]);
      const decoded = jsQR(pixels, side, side, { inversionAttempts: "dontInvert" });
      expect(decoded?.data).toBe(PASS);
    },
  );
});
