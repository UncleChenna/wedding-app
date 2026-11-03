import { mkdirSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { listThemes } from "../../src/modules/theming";
import { qrMatrix, qrPathData, qrViewBoxSize } from "../../src/modules/shared/lib/qr";
import { scanA11y } from "./axe";
import { applyTheme } from "./theme";

const exampleSecret = "JBSWY3DPEHPK3PXP";
const exampleUri = `otpauth://totp/Example?secret=${exampleSecret}&issuer=Example`;
const exampleMatrix = qrMatrix(exampleUri);

async function waitForMfaAnimations(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState !== "finished" &&
                animation.playState !== "idle" &&
                animation.effect?.getTiming().iterations !== Infinity,
            ).length,
      ),
    )
    .toBe(0);
}

/** Real authenticated UI; only the pictured setup key/QR are replaced by a public sample before saving. */
export async function reviewMfa(page: Page, state: string) {
  if (process.env.CAPTURE_MFA_SCREENSHOTS !== "1") return;
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of listThemes()) {
    await page.bringToFront();
    await applyTheme(page, theme, waitForMfaAnimations);
    for (const width of [375, 768, 1280]) {
      await page.bringToFront();
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      await waitForMfaAnimations(page);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const control of await page
        .locator("button, input:not([type=hidden]), summary, a")
        .all()) {
        if (!(await control.isVisible())) continue;
        const box = await control.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
        expect(box?.width).toBeGreaterThanOrEqual(44);
      }
      await page.getByRole("heading", { level: 1 }).click();
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => {
          const element = document.activeElement;
          return (
            element instanceof HTMLElement &&
            element.matches("input,button,a,summary") &&
            getComputedStyle(element).outlineStyle !== "none"
          );
        }),
      ).toBe(true);
      const qr = page.getByRole("img", { name: "Authenticator setup QR code" });
      let original: { text: string; path: string; viewBox: string; modules: string } | undefined;
      if (await qr.count()) {
        const png = (await qr.screenshot()).toString("base64");
        const image = await page.evaluate(async (data) => {
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Missing canvas context");
          context.drawImage(bitmap, 0, 0);
          const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height);
          return { data: Array.from(pixels.data), width: pixels.width, height: pixels.height };
        }, png);
        const decoded = jsQR(Uint8ClampedArray.from(image.data), image.width, image.height);
        expect(decoded?.data.startsWith("otpauth://totp/")).toBe(true);
        original = await page.evaluate(
          ({ secret, path, side, modules }) => {
            const key = document.querySelector('[data-testid="setup-key"]');
            const svg = document.querySelector('[aria-label="Authenticator setup QR code"]');
            const mark = svg?.querySelector("path");
            if (!key || !svg || !mark) throw new Error("Missing setup code");
            const original = {
              text: key.textContent ?? "",
              path: mark.getAttribute("d") ?? "",
              viewBox: svg.getAttribute("viewBox") ?? "",
              modules: svg.getAttribute("data-qr-modules") ?? "",
            };
            key.textContent = `Example key: ${secret}`;
            mark.setAttribute("d", path);
            svg.setAttribute("viewBox", `0 0 ${side} ${side}`);
            svg.querySelector("rect")?.setAttribute("width", String(side));
            svg.querySelector("rect")?.setAttribute("height", String(side));
            svg.setAttribute("data-qr-modules", String(modules));
            return original;
          },
          {
            secret: exampleSecret,
            path: qrPathData(exampleMatrix),
            side: qrViewBoxSize(exampleMatrix),
            modules: exampleMatrix.size,
          },
        );
      }
      const folder = `artifacts/TICKET-030/${theme.id}/${width}`;
      mkdirSync(folder, { recursive: true });
      await page.screenshot({ path: `${folder}/${state}.png`, fullPage: true });
      if (original)
        await page.evaluate((original) => {
          const key = document.querySelector('[data-testid="setup-key"]');
          const svg = document.querySelector('[aria-label="Authenticator setup QR code"]');
          if (!key || !svg) throw new Error("Missing setup code");
          key.textContent = original.text;
          svg.querySelector("path")?.setAttribute("d", original.path);
          svg.setAttribute("viewBox", original.viewBox);
          const side = original.viewBox.split(" ").at(-1) ?? "";
          svg.querySelector("rect")?.setAttribute("width", side);
          svg.querySelector("rect")?.setAttribute("height", side);
          svg.setAttribute("data-qr-modules", original.modules);
        }, original);
    }
  }
}
