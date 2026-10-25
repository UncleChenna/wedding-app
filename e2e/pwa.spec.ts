import { expect, test, type Page } from "@playwright/test";

/**
 * Service worker on the production build (TICKET-105, ADR 0014): registered at root
 * scope, never cached itself, caches only immutable build assets, and never stores
 * pages, invitation URLs, admin or API responses.
 */
async function controlledPage(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first load registers the worker; a reload puts the page under its control.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

const cachedUrls = (page: Page) =>
  page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) urls.push(new URL(request.url).pathname);
    }
    return urls;
  });

test.describe("service worker @smoke", () => {
  test("is served from the root with no-cache headers", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("javascript");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).toContain("cachePolicy");
  });

  test("registers at root scope and controls pages", async ({ page }) => {
    await controlledPage(page);
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    expect(new URL(scope).pathname).toBe("/");
  });

  test("caches only immutable build assets, never pages, invitations, admin or APIs", async ({
    page,
  }) => {
    await controlledPage(page);
    for (const path of ["/admin", "/i/not-a-real-token", "/order", "/checkin", "/dev/theme"]) {
      await page.goto(path);
    }
    await page.evaluate(() => fetch("/api/does-not-exist").catch(() => undefined));
    const urls = await cachedUrls(page);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toMatch(/^\/_next\/static\//);
  });

  test("offline, cached assets still load but private pages are not served from cache", async ({
    page,
    context,
  }) => {
    await controlledPage(page);
    await page.goto("/admin");
    const [asset] = (await cachedUrls(page)).filter((url) => url.endsWith(".js"));
    expect(asset).toBeTruthy();

    await context.setOffline(true);
    const assetOk = await page.evaluate(async (url) => (await fetch(url)).ok, asset as string);
    expect(assetOk).toBe(true);
    const adminOffline = await page.evaluate(() =>
      fetch("/admin").then(
        () => "served",
        () => "network error",
      ),
    );
    expect(adminOffline).toBe("network error");
    await context.setOffline(false);
  });
});
