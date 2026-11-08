import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { localAdminLogin } from "./local-admin-login";
import { totp } from "./totp";

/**
 * Signs in through the real email-code and TOTP flow on this worktree's local Auth. Each address
 * can enrol TOTP only once, so pass a fresh one per run and put it on ADMIN_EMAIL_ALLOWLIST.
 */
export async function signInAdmin(page: Page, request: APIRequestContext, email: string) {
  await localAdminLogin(page, request, email);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  const secret = (await page.getByTestId("setup-key").textContent()) ?? "";
  await page.getByLabel("Authenticator code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** The admin address for this run: ADMIN_TEST_EMAIL, else a per-project default. */
export function adminTestEmail(project: string, prefix: string) {
  return (
    process.env.ADMIN_TEST_EMAIL ??
    process.env.ADMIN_MENU_TEST_EMAIL ??
    `${prefix}-${project}@example.test`
  );
}
