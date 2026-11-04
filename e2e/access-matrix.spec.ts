import { expect, test } from "@playwright/test";

test("anonymous requests cannot cross privileged boundaries @smoke", async ({ request, page }) => {
  for (const route of [
    "/admin",
    "/admin/sharing",
    "/checkin/private",
    "/kitchen/private",
    "/bar/private",
  ]) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status(), route).toBe(307);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    const mutation = await request.post(route, { data: { forgedRole: "admin" }, maxRedirects: 0 });
    expect(mutation.status(), route).toBe(403);
    expect(await mutation.json()).toEqual({ error: "Sign-in required." });
  }
  for (const station of ["admin", "checkin", "kitchen", "bar"]) {
    for (const method of ["GET", "POST"]) {
      const response = await request.fetch(`/api/${station}/private`, {
        method,
        headers: { "x-user-role": "admin" },
      });
      expect(response.status()).toBe(403);
    }
  }
  for (const route of ["/checkin", "/kitchen", "/bar"]) {
    await page.goto(route);
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    await expect(page.getByText("You’re signed in.", { exact: true })).toHaveCount(0);
  }
});

test("public guest endpoints validate inputs without requiring staff credentials @smoke", async ({
  request,
}) => {
  const order = await request.post("/api/orders", { data: {} });
  expect(order.status()).toBe(422);
  expect(await order.json()).toEqual({ status: "rejected", reason: "invalid" });
  expect(order.headers()["location"]).toBeUndefined();
  const privateReply = await request.get("/i/not-a-capability/offline-pass");
  expect(privateReply.status()).toBe(404);
  expect(await privateReply.text()).not.toContain("householdName");
  const orderRead = await request.get("/api/orders");
  expect(orderRead.status()).toBe(405);
});
