import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { normalizePhoto } from "../server/photo-image";

const fixture = () =>
  sharp({ create: { width: 80, height: 40, channels: 3, background: { r: 30, g: 80, b: 100 } } });

describe("photo byte normalization", () => {
  it.each(["jpeg", "png", "webp"] as const)(
    "decodes %s and emits bounded metadata-free WebP and blur",
    async (format) => {
      const input = await fixture().toFormat(format).toBuffer();
      const result = await normalizePhoto(input, `image/${format}`);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toMatchObject({ mime: "image/webp", width: 80, height: 40 });
      const meta = await sharp(result.value.bytes).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.exif).toBeUndefined();
      expect(meta.icc).toBeUndefined();
      expect(result.value.blurDataURL).toMatch(/^data:image\/webp;base64,/);
      const blur = await sharp(
        Buffer.from(result.value.blurDataURL.split(",")[1] ?? "", "base64"),
      ).metadata();
      expect(Math.max(blur.width ?? 0, blur.height ?? 0)).toBeLessThanOrEqual(24);
    },
  );
  it("applies EXIF orientation and removes original metadata", async () => {
    const input = await fixture()
      .withMetadata({ orientation: 6 })
      .withExif({ IFD0: { Artist: "Private camera owner" } })
      .jpeg()
      .toBuffer();
    const result = await normalizePhoto(input, "image/jpeg");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({ width: 40, height: 80 });
    expect((await sharp(result.value.bytes).metadata()).orientation).toBeUndefined();
    expect(result.value.bytes.includes(Buffer.from("Private camera owner"))).toBe(false);
  });
  it("accepts progressive JPEG scans without retaining their original container", async () => {
    const input = await fixture().jpeg({ progressive: true }).toBuffer();
    expect((await normalizePhoto(input, "image/jpeg")).ok).toBe(true);
  });
  it("rejects animated WebP rather than silently keeping only its first frame", async () => {
    const frame = "21f904000a0000002c0000000001000100000202440100";
    const gif = Buffer.from(
      "47494638396101000100800000000000ffffff" +
        frame +
        frame.replace("02440100", "024c0100") +
        "3b",
      "hex",
    );
    const input = await sharp(gif, { animated: true }).webp().toBuffer();
    expect((await sharp(input, { animated: true }).metadata()).pages).toBe(2);
    expect((await normalizePhoto(input, "image/webp")).ok).toBe(false);
  });
  it("resizes large decoded dimensions without upscaling small images", async () => {
    const input = await sharp({
      create: { width: 3000, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();
    const result = await normalizePhoto(input, "image/png");
    expect(result.ok && result.value.width).toBe(2560);
  });
  it("rejects MIME mismatch, unsupported types, empty and oversized inputs", async () => {
    const input = await fixture().png().toBuffer();
    for (const [bytes, mime] of [
      [input, "image/jpeg"],
      [input, "image/svg+xml"],
      [Buffer.alloc(0), "image/png"],
      [Buffer.alloc(8 * 1024 * 1024 + 1), "image/png"],
    ] as const)
      expect((await normalizePhoto(bytes, mime)).ok).toBe(false);
  });
  it.each(["jpeg", "png", "webp"] as const)(
    "rejects truncated %s and appended payloads",
    async (format) => {
      const input = await fixture().toFormat(format).toBuffer();
      for (const invalid of [
        input.subarray(0, input.length - 5),
        Buffer.concat([input, Buffer.from("<script>payload</script>")]),
        Buffer.concat([input, input]),
      ])
        expect((await normalizePhoto(invalid, `image/${format}`)).ok).toBe(false);
    },
  );
  it("rejects excessive dimensions and pixel counts before output processing", async () => {
    for (const [width, height] of [
      [8193, 1],
      [6000, 5000],
    ] as const) {
      const input = await sharp({
        create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .png()
        .toBuffer();
      expect((await normalizePhoto(input, "image/png")).ok).toBe(false);
    }
  });
});
