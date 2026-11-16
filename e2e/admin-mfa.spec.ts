import { expect, test } from "@playwright/test";
import { localAdminLogin } from "./support/local-admin-login";

test("anonymous admin visits require sign-in @smoke", async ({ page, request }) => {
  const raw = await request.get("/admin", { maxRedirects: 0 });
  expect(await raw.text()).not.toContain("Wedding control room");
  expect(raw.headers()["referrer-policy"]).toBe("no-referrer");
  expect(raw.headers()["x-robots-tag"]).toContain("noindex");
  expect(raw.headers()["cache-control"]).toContain("no-store");
  for (const path of ["/admin", "/admin/mfa", "/admin/sharing"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
    await expect(page.getByLabel("Email address")).toBeVisible();
  }
});

test("verified email opens admin without authenticator setup", async ({
  page,
  request,
  context,
}, info) => {
  test.skip(
    process.env.RUN_ADMIN_MFA_TESTS !== "1",
    "Requires explicitly enabled isolated local Auth",
  );
  await localAdminLogin(
    page,
    request,
    `${process.env.MFA_TEST_PREFIX ?? "mfa"}-${info.project.name}@example.test`,
  );
  for (const path of ["/admin", "/admin/mfa"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Wedding control room", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Set up authenticator" })).toHaveCount(0);
  }
  const authCookies = (await context.cookies()).filter((cookie) =>
    cookie.name.includes("auth-token"),
  );
  expect(authCookies.length).toBeGreaterThan(0);
  expect(authCookies.every((cookie) => cookie.httpOnly)).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("auth-token");
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("sb-"))),
  ).toEqual([]);
  await page.reload();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/sign-out");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page
      .getByRole("status", { name: "Account status" })
      .filter({ hasText: "signed out" })
      .or(page.getByRole("heading", { name: "You’re signed out", exact: true })),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
});
