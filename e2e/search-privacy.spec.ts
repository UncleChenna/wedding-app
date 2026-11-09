import { expect, test } from "@playwright/test";

const privateRoutes = [
  "/i/not-a-real-token",
  "/p/not-a-real-pass",
  "/order",
  "/staff",
  "/checkin",
  "/kitchen",
  "/bar",
  "/admin",
  "/admin/sign-in",
  "/dev/theme",
];

test("@smoke every private route sends noindex", async ({ request }) => {
  for (const route of privateRoutes) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.headers()["x-robots-tag"] ?? "", route).toContain("noindex");
  }
});

test("@smoke the public home stays indexable", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-robots-tag"] ?? "").not.toContain("noindex");
});

test("@smoke robots.txt disallows staff and admin but not personal links", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  for (const path of ["/staff", "/checkin", "/kitchen", "/bar", "/admin"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).not.toMatch(/Disallow: \/(i|p)\s*$/m);
});
