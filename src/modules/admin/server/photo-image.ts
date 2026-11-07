import "server-only";
import sharp from "sharp";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PIXELS = 24_000_000;
const mimeFormats = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" } as const;

/** Require one complete container, not an image followed by a second payload. */
function completeContainer(bytes: Buffer, format: string): boolean {
  if (format === "webp") {
    if (
      bytes.length < 20 ||
      bytes.toString("ascii", 0, 4) !== "RIFF" ||
      bytes.toString("ascii", 8, 12) !== "WEBP" ||
      bytes.readUInt32LE(4) + 8 !== bytes.length
    )
      return false;
    const allowed = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ICCP", "EXIF", "XMP "]);
    let position = 12;
    while (position + 8 <= bytes.length) {
      if (!allowed.has(bytes.toString("ascii", position, position + 4))) return false;
      const length = bytes.readUInt32LE(position + 4);
      position += 8 + length + (length % 2);
    }
    return position === bytes.length;
  }
  if (format === "png") {
    if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
    const allowed = new Set([
      "IHDR",
      "PLTE",
      "IDAT",
      "IEND",
      "tRNS",
      "cHRM",
      "gAMA",
      "iCCP",
      "sBIT",
      "sRGB",
      "bKGD",
      "hIST",
      "pHYs",
      "sPLT",
      "tIME",
      "iTXt",
      "tEXt",
      "zTXt",
      "eXIf",
    ]);
    let position = 8;
    while (position + 12 <= bytes.length) {
      const length = bytes.readUInt32BE(position);
      const type = bytes.toString("ascii", position + 4, position + 8);
      if (!allowed.has(type) || (position === 8 && type !== "IHDR")) return false;
      position += 12 + length;
      if (type === "IEND") return length === 0 && position === bytes.length;
    }
    return false;
  }
  if (bytes[0] !== 255 || bytes[1] !== 216) return false;
  let position = 2;
  let scanned = false;
  while (position < bytes.length) {
    if (bytes[position++] !== 255) return false;
    while (bytes[position] === 255) position++;
    const marker = bytes[position++];
    if (marker === 217) return scanned && position === bytes.length;
    if (
      marker === undefined ||
      marker === 0 ||
      marker === 216 ||
      (marker >= 208 && marker <= 215) ||
      position + 2 > bytes.length
    )
      return false;
    const length = bytes.readUInt16BE(position);
    if (length < 2 || position + length > bytes.length) return false;
    position += length;
    if (marker === 218) {
      scanned = true;
      // Entropy data permits byte stuffing and restart markers. Other markers
      // resume the segment parser (including progressive JPEG's next scan).
      while (position < bytes.length) {
        if (bytes[position] !== 255) {
          position++;
          continue;
        }
        const next = bytes[position + 1];
        if (next === 0 || (next !== undefined && next >= 208 && next <= 215)) {
          position += 2;
          continue;
        }
        break;
      }
    }
  }
  return false;
}

export interface NormalizedPhoto {
  bytes: Buffer;
  mime: "image/webp";
  width: number;
  height: number;
  blurDataURL: string;
}

/** Internal decoder. The upload boundary must authorize before reading file bytes. */
export async function normalizePhoto(
  input: Uint8Array,
  mime: string,
): Promise<{ ok: true; value: NormalizedPhoto } | { ok: false; message: string }> {
  const invalid = {
    ok: false as const,
    message: "Choose a still JPEG, PNG or WebP photo up to 8 MB.",
  };
  if (!input.byteLength || input.byteLength > MAX_BYTES || !Object.hasOwn(mimeFormats, mime))
    return invalid;
  const format = mimeFormats[mime as keyof typeof mimeFormats];
  const bytes = Buffer.from(input);
  if (!completeContainer(bytes, format)) return invalid;
  try {
    const decoder = sharp(bytes, {
      limitInputPixels: MAX_PIXELS,
      failOn: "warning",
      sequentialRead: true,
    }).timeout({ seconds: 5 });
    const meta = await decoder.metadata();
    if (
      meta.format !== format ||
      !meta.width ||
      !meta.height ||
      meta.width > 8192 ||
      meta.height > 8192 ||
      meta.width * meta.height > MAX_PIXELS ||
      (meta.pages ?? 1) !== 1
    )
      return invalid;
    // Sharp strips metadata by default. Never call keepMetadata/withMetadata here.
    const output = await decoder
      .autoOrient()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    if (output.data.byteLength > 4 * 1024 * 1024) return invalid;
    const blur = await sharp(output.data, { limitInputPixels: MAX_PIXELS })
      .timeout({ seconds: 5 })
      .resize({ width: 24, height: 24, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();
    if (blur.length > 8192) return invalid;
    return {
      ok: true,
      value: {
        bytes: output.data,
        mime: "image/webp",
        width: output.info.width,
        height: output.info.height,
        blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
      },
    };
  } catch {
    // Codec errors can contain paths/metadata. Return only the safe public message.
    return invalid;
  }
}
