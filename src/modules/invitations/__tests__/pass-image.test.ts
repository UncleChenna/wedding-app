import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, it, vi } from "vitest";
import jsQR from "jsqr";
import { getTheme } from "@/modules/theming";
import { themes } from "@/modules/theming/themes";
import { renderPassImage } from "../server/pass-image";

type Raster = { data: Buffer; info: { width: number; height: number } };
const sharp = createRequire(import.meta.resolve("next"))("sharp") as (bytes: Buffer) => {
  ensureAlpha(): { raw(): { toBuffer(options: { resolveWithObject: true }): Promise<Raster> } };
};
it("renders a private 1080px pass whose QR decodes in every theme without remote font requests", async () => {
  const originalFetch = globalThis.fetch;
  const remoteRequests: string[] = [];
  const remote = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = String(input);
    if (!url.startsWith("data:")) {
      remoteRequests.push(url);
      return Promise.reject(new Error("Remote request forbidden"));
    }
    return originalFetch(input, init);
  });
  try {
    for (const theme of themes) {
      const response = await renderPassImage(
        { name: "Uchenna & Adaora", partySize: 2, url: "https://example.com/p/signed-read-only" },
        theme,
      );
      expect(response.headers.get("cache-control")).toContain("no-store");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (process.env.REVIEW_PASS_IMAGE === "1") {
        mkdirSync("docs/reviews/TICKET-045", { recursive: true });
        writeFileSync("docs/reviews/TICKET-045/" + theme.id + "-image.png", bytes);
      }
      const result = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(result.info.width).toBe(1080);
      const code = jsQR(new Uint8ClampedArray(result.data), result.info.width, result.info.height);
      expect(code?.data).toBe("https://example.com/p/signed-read-only");
    }
    expect(remoteRequests).toEqual([]);
  } finally {
    remote.mockRestore();
  }
});

it("keeps long names on the image and rejects unsupported glyphs locally", async () => {
  const name = "Adaora Nneka Chiamaka ".repeat(12);
  const response = await renderPassImage(
    { name, partySize: 7, url: "https://example.com/p/signed" },
    getTheme("ivory-gold"),
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  const result = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(result.info.width).toBe(1080);
  expect(result.info.height).toBeGreaterThan(1600);
  expect(
    jsQR(new Uint8ClampedArray(result.data), result.info.width, result.info.height)?.data,
  ).toBe("https://example.com/p/signed");
  await expect(
    renderPassImage(
      { name: "Guest \u{10FFFF}", partySize: 1, url: "https://example.com/p/signed" },
      getTheme("ivory-gold"),
    ),
  ).rejects.toThrow("Local font");
});
