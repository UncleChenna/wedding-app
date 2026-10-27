import { expect, test } from "@playwright/test";
import jsQR from "jsqr";

import { hexToRgb } from "../src/modules/theming/lib/contrast";
import { listThemes } from "../src/modules/theming";

const rgb = (hex: string) => `rgb(${hexToRgb(hex).join(", ")})`;

/** The themed QR code (TICKET-170): dark on light in every theme, and it scans as rendered. */
test.describe("QR code on /dev/theme @smoke", () => {
  for (const theme of listThemes()) {
    test(`${theme.id}: the rendered QR uses the theme's ink and paper and decodes`, async ({
      page,
    }) => {
      await page.goto("/dev/theme");
      const qr = page
        .getByTestId(`theme-${theme.id}`)
        .getByRole("img", { name: "Sample gate pass QR code" });
      await expect(qr).toBeVisible();

      const fills = await qr.evaluate((svg) => ({
        paper: getComputedStyle(svg.querySelector("rect") as Element).fill,
        ink: getComputedStyle(svg.querySelector("path") as Element).fill,
        modules: Number(svg.getAttribute("data-qr-modules")),
        viewBox: svg.getAttribute("viewBox"),
      }));
      expect(fills.paper).toBe(rgb(theme.colors["qr-paper"]));
      expect(fills.ink).toBe(rgb(theme.colors["qr-ink"]));
      // Four quiet-zone modules on each side.
      expect(fills.viewBox).toBe(`0 0 ${fills.modules + 8} ${fills.modules + 8}`);

      // Decode the pixels the browser actually painted, as a phone camera would see them.
      const png = (await qr.screenshot()).toString("base64");
      const image = await page.evaluate(async (data) => {
        // atob, not fetch: the site's CSP blocks data: URLs in connect-src.
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "image/png" });
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
        context.drawImage(bitmap, 0, 0);
        const {
          data: pixels,
          width,
          height,
        } = context.getImageData(0, 0, bitmap.width, bitmap.height);
        return { pixels: Array.from(pixels), width, height };
      }, png);
      const decoded = jsQR(Uint8ClampedArray.from(image.pixels), image.width, image.height, {
        inversionAttempts: "dontInvert",
      });
      expect(decoded?.data).toMatch(/^https:\/\/wedding\.example\/p\//);
    });
  }
});
