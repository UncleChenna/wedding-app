import { expect, test } from "@playwright/test";

const forged =
  "eyJ2IjoxLCJraWQiOiJrMSIsImludiI6IjZmMWMyYTRlLThiM2QtNGM1YS05ZTdmLTFhMmIzYzRkNWU2ZiIsInZlciI6MSwiaWF0IjoxfQ." +
  "A".repeat(86);

test.describe("gate pass page @smoke", () => {
  test("keeps a pass URL out of caches, referrers and search results", async ({ page }) => {
    const response = await page.goto(`/p/${forged}`);
    expect(response?.status()).toBe(200);
    const headers = response?.headers() ?? {};
    expect(headers["cache-control"]).toContain("no-store");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
  });

  test("shows a warm not-found state for a forged pass with nothing to edit", async ({ page }) => {
    await page.goto(`/p/${forged}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form, input, button[type=submit]")).toHaveCount(0);
    await expect(page.locator('a[href^="/i/"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Back to our day" })).toHaveAttribute("href", "/");
  });

  test("uses the same generic title and preview for every pass", async ({ page }) => {
    await page.goto(`/p/${forged}`);
    await expect(page).toHaveTitle(/Your gate pass/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Your gate pass",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/invitation-preview$/,
    );
    const metadata = await page
      .locator("head meta, head link[rel=canonical]")
      .evaluateAll((nodes) => nodes.map((node) => node.outerHTML).join("\n"));
    expect(metadata).not.toContain(forged);
  });
});
