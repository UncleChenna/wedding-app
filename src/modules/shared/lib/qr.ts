import { create } from "qrcode";

/** Light modules around the code on every side; scanners need at least four (design principles §5). */
export const QR_QUIET_ZONE = 4;

export interface QrMatrix {
  /** Modules per side, excluding the quiet zone. */
  size: number;
  /** Row-major; true is a dark module. */
  dark: readonly boolean[];
}

/** Encode text as a QR module grid. Medium error correction survives a little screen glare. */
export function qrMatrix(text: string): QrMatrix {
  const { modules } = create(text, { errorCorrectionLevel: "M" });
  return { size: modules.size, dark: Array.from(modules.data, (bit) => bit === 1) };
}

/** Side length in modules, including the quiet zone on both sides. */
export function qrViewBoxSize({ size }: QrMatrix): number {
  return size + QR_QUIET_ZONE * 2;
}

/** One SVG path for every dark module, offset by the quiet zone. */
export function qrPathData({ size, dark }: QrMatrix): string {
  const parts: string[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (dark[row * size + col]) {
        parts.push(`M${col + QR_QUIET_ZONE} ${row + QR_QUIET_ZONE}h1v1h-1z`);
      }
    }
  }
  return parts.join("");
}
