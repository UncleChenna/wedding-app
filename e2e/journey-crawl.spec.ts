import { expect, test } from "@playwright/test";
import { crawlRoutes, requireReachableRoutes } from "./support/journey-crawl";

test("the route crawl rejects an unlinked registered page @smoke", async ({ page }) => {
  await page.route("**/journey-fixture/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const links = path.endsWith("/home")
      ? '<a href="/journey-fixture/connected">Continue</a>'
      : '<a href="/journey-fixture/home">Home</a>';
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<main><h1>Fixture</h1>${links}</main>`,
    });
  });
  const paths = ["/journey-fixture/home", "/journey-fixture/connected", "/journey-fixture/orphan"];
  const visited = await crawlRoutes(page, ["/journey-fixture/home"], paths);
  expect([...visited].sort()).toEqual(paths.slice(0, 2).sort());
  expect(() => requireReachableRoutes(paths, visited)).toThrow(
    "Unreachable routes: /journey-fixture/orphan",
  );
});
