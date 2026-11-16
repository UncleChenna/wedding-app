import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { localAdminLogin } from "./local-admin-login";

/** Signs in with a verified, allowlisted email on the isolated local Auth service. */
export async function signInAdmin(page: Page, request: APIRequestContext, email: string) {
  await localAdminLogin(page, request, email);
  await page.goto("/admin");
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
