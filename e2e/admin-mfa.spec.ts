import { expect, test } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { localAdminLogin } from "./support/local-admin-login";
import { totp } from "./support/totp";
import { reviewMfa } from "./support/mfa-review";

test("anonymous admin visits require sign-in @smoke", async ({ page, request }) => {
  const raw = await request.get("/admin", { maxRedirects: 0 });
  expect(await raw.text()).not.toContain("Wedding control room");
  for (const path of ["/admin", "/admin/mfa"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
    await expect(page.getByLabel("Email address")).toBeVisible();
  }
});

test("local TOTP enrolment gates admin and upgrades the session", async ({
  page,
  request,
  context,
}, info) => {
  test.skip(
    process.env.RUN_ADMIN_MFA_TESTS !== "1",
    "Requires explicitly enabled isolated local Auth",
  );
  test.setTimeout(process.env.CAPTURE_MFA_SCREENSHOTS === "1" ? 240000 : 90000);
  await localAdminLogin(
    page,
    request,
    `${process.env.MFA_TEST_PREFIX ?? "mfa"}-${info.project.name}@example.test`,
  );
  const aal1Cookies = await context.cookies();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await expect(page.getByRole("heading", { name: "Protect your account" })).toBeVisible();
  await reviewMfa(page, "enrolment");
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  await expect(page.getByTestId("setup-key")).toBeVisible();
  const secret = (await page.getByTestId("setup-key").textContent()) ?? "";
  await reviewMfa(page, "setup");
  const factorId = await page.locator("input[name=factorId]").inputValue();
  await page.locator("input[name=factorId]").evaluate((input: HTMLInputElement) => {
    input.value = "b0544ecb-f28f-443c-ac7a-1c5a36434211";
  });
  await page.getByLabel("Authenticator code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByRole("status", { name: "Two-step status" })).toContainText(
    "no longer available",
  );
  await page.locator("input[name=factorId]").evaluate((input: HTMLInputElement, id: string) => {
    input.value = id;
  }, factorId);
  await page.getByLabel("Authenticator code").fill(totp(secret, Date.now() - 300000));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page.getByRole("status", { name: "Two-step status" })).toContainText(
    "couldn’t be verified",
  );
  await reviewMfa(page, "invalid-code");
  const enrolledCode = totp(secret);
  await page.getByLabel("Authenticator code").fill(enrolledCode);
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId("setup-key")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Wedding control room", exact: true }),
  ).toBeVisible();
  await reviewMfa(page, "admin");
  const aal2Cookies = await context.cookies();
  expect(
    aal2Cookies
      .filter((cookie) => cookie.name.includes("auth-token"))
      .every((cookie) => cookie.httpOnly),
  ).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("auth-token");
  expect(
    await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("sb-"))),
  ).toEqual([]);
  // A still-valid first-factor access token must not inherit another session's AAL2.
  await context.clearCookies();
  await context.addCookies(aal1Cookies);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await expect(page.getByRole("heading", { name: "One more step" })).toBeVisible();
  await reviewMfa(page, "challenge");
  // A new time step avoids replaying the enrolment code.
  await expect
    .poll(() => totp(secret), { timeout: 35000, intervals: [500] })
    .not.toBe(enrolledCode);
  await page.getByLabel("Authenticator code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Wedding control room", exact: true }),
  ).toBeVisible();
  // Remove only this disposable fixture account's own factor while verified at AAL2.
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll: async () => (await context.cookies()).map(({ name, value }) => ({ name, value })),
        setAll: () => {},
      },
    },
  );
  const removed = await auth.auth.mfa.unenroll({ factorId });
  expect(removed.error).toBeNull();
  await page.goto("/admin/sign-out");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("status", { name: "Account status" })).toContainText("signed out");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
});
