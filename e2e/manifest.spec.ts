import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { z } from "zod";

const manifestSchema = z.object({
  id: z.literal("/"),
  name: z.string().min(1),
  short_name: z.string().min(1),
  start_url: z.literal("/"),
  scope: z.literal("/"),
  display: z.literal("standalone"),
  theme_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  background_color: z.string().regex(/^#[0-9a-f]{6}$/i),
  lang: z.literal("en"),
});

test("@smoke public manifest has complete branding and safe launch paths", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/manifest+json");
  manifestSchema.parse(await response.json());
  // A deployment must not serve a prerendered manifest indefinitely after a theme change.
  expect(response.headers()["cache-control"] ?? "").not.toMatch(/immutable|s-maxage=31536000/);
  const ordinary = await response.json();
  const supplied = await request.get(
    "/manifest.webmanifest?token=private-invitation&start_url=/checkin",
  );
  expect(await supplied.json()).toEqual(ordinary);
  expect(await supplied.text()).not.toContain("private-invitation");
});

test("@smoke browser discovers and parses the manifest without syntax errors", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  const cdp = await context.newCDPSession(page);
  try {
    const result = await cdp.send("Page.getAppManifest");
    expect(result.url).toMatch(/\/manifest.webmanifest$/);
    expect(result.errors).toEqual([]);
    manifestSchema.parse(JSON.parse(result.data ?? ""));
    if (process.env.RUN_MANIFEST_REVIEW === "1") {
      const installability = await cdp.send("Page.getInstallabilityErrors");
      mkdirSync("docs/reviews/TICKET-103", { recursive: true });
      writeFileSync(
        "docs/reviews/TICKET-103/browser-manifest.json",
        JSON.stringify(
          { manifest: JSON.parse(result.data ?? ""), parseErrors: result.errors, installability },
          null,
          2,
        ) + "\n",
      );
    }
  } finally {
    await cdp.detach();
  }
});
