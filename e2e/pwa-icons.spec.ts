import { expect, test } from "@playwright/test";
import { z } from "zod";

test("@smoke installation metadata serves real icons and Apple startup images", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const apple = page.locator('link[rel="apple-touch-icon"]');
  await expect(apple).toHaveAttribute("sizes", "180x180");
  const href = await apple.getAttribute("href");
  expect(href).toMatch(/^\/icons\/[a-z-]+\/apple-touch-180.png$/);
  const response = await request.get(href ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    "content",
    "yes",
  );
  const startup = page.locator('link[rel="apple-touch-startup-image"]');
  await expect(startup).toHaveCount(12);
  const media = await startup.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("media")),
  );
  expect(new Set(media).size).toBe(12);
  for (const url of await startup.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href")),
  )) {
    expect((await request.get(url ?? "")).status()).toBe(200);
  }
  const manifest = z
    .object({
      icons: z
        .array(
          z.object({ src: z.string(), sizes: z.string(), purpose: z.enum(["any", "maskable"]) }),
        )
        .length(4),
    })
    .parse(await (await request.get("/manifest.webmanifest")).json());
  expect(manifest.icons.map((icon) => icon.purpose).sort()).toEqual([
    "any",
    "any",
    "maskable",
    "maskable",
  ]);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status()).toBe(200);
});
