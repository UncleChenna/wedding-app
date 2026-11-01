import { describe, expect, it } from "vitest";
import {
  iconThemeIds,
  startupImages,
  installationMetadata,
} from "../../src/modules/shared/lib/pwa-assets";
import { readFile } from "node:fs/promises";
import { renderIcon, sharp } from "../pwa-icons";

describe("generated installation icons", () => {
  it.each(iconThemeIds)(
    "is reproducible for %s, opaque, correctly sized and inside the maskable safe zone",
    async (theme) => {
      const first = await renderIcon(theme, 192, 192, 0.52);
      expect(await renderIcon(theme, 192, 192, 0.52)).toEqual(first);
      const { data, info } = await sharp(first)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect([info.width, info.height]).toEqual([192, 192]);
      let foreground = 0;
      for (let y = 0; y < 192; y++)
        for (let x = 0; x < 192; x++) {
          const p = (y * 192 + x) * 4;
          expect(data[p + 3]).toBe(255);
          if (data[p] !== data[0] || data[p + 1] !== data[1] || data[p + 2] !== data[2]) {
            foreground++;
            expect(Math.hypot(x - 95.5, y - 95.5)).toBeLessThan(192 * 0.4);
          }
        }
      expect(foreground).toBeGreaterThan(100);
    },
  );
  it.each(iconThemeIds)("ships every advertised startup image for %s", async (theme) => {
    const entries = startupImages(theme);
    expect(entries).toHaveLength(12);
    expect(new Set(entries.map((entry) => entry.media)).size).toBe(12);
    for (const entry of entries) {
      const file = await readFile("public" + entry.url);
      const { info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
      expect(entry.url).toContain(info.width + "x" + info.height);
      expect(info.channels).toBe(3);
    }
    expect(installationMetadata(theme).icons).toMatchObject({ apple: [{ sizes: "180x180" }] });
  });

  it.each(iconThemeIds)("committed icon files match generation for %s", async (theme) => {
    for (const size of [192, 512])
      for (const purpose of ["any", "maskable"]) {
        const bytes = await readFile("public/icons/" + theme + "/" + purpose + "-" + size + ".png");
        expect(bytes).toEqual(
          await renderIcon(theme, size, size, purpose === "maskable" ? 0.52 : 0.62),
        );
        const { data, info } = await sharp(bytes)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        expect([info.width, info.height]).toEqual([size, size]);
        if (purpose === "maskable") {
          let maximumDistance = 0;
          for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
              const p = (y * size + x) * 4;
              if (data[p] !== data[0] || data[p + 1] !== data[1] || data[p + 2] !== data[2])
                maximumDistance = Math.max(
                  maximumDistance,
                  Math.hypot(x - (size - 1) / 2, y - (size - 1) / 2),
                );
            }
          expect(maximumDistance).toBeLessThan(size * 0.4);
        }
      }
    expect(await readFile("public/icons/" + theme + "/apple-touch-180.png")).toEqual(
      await renderIcon(theme, 180, 180, 0.62),
    );
  });
});
