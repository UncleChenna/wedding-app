import { writeFileSync, mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** Can use a disposable private invitation path; never save the invitation URL in evidence. */
test("mobile invitation photographs stay within the 150 KB delivery budget", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const delivered: { status: number; type: string; bytes: number }[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", (response) => {
    if (!response.url().includes("/_next/image?")) return;
    pending.push(
      (async () => {
        const body = await response.body();
        delivered.push({
          status: response.status(),
          type: response.headers()["content-type"] ?? "",
          bytes: body.byteLength,
        });
      })(),
    );
  });
  await page.goto(process.env.INVITATION_IMAGE_PATH ?? "/dev/invitation/letter");
  const photographs = page.locator("main img[srcset]");
  await expect(photographs.first()).toBeVisible();
  await expect
    .poll(() =>
      photographs.evaluateAll((images) =>
        images.every(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await Promise.all(pending);
  expect(delivered.length).toBeGreaterThan(0);
  for (const image of delivered) {
    expect(image.status).toBe(200);
    expect(image.type).toMatch(/^image\/(avif|webp)/);
    expect(image.bytes).toBeLessThanOrEqual(150_000);
  }
  mkdirSync("artifacts/TICKET-119", { recursive: true });
  writeFileSync(
    "artifacts/TICKET-119/mobile-image-budget.json",
    JSON.stringify(
      {
        width: 375,
        deviceScaleFactor: await page.evaluate(() => devicePixelRatio),
        privateFixture: Boolean(process.env.INVITATION_IMAGE_PATH),
        images: delivered,
      },
      null,
      2,
    ) + "\n",
  );
});
