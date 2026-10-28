import { expect, type Page } from "@playwright/test";

/**
 * Every page the app serves, for checks that must cover the whole site (accessibility,
 * overflow). `e2e/a11y-routes.spec.ts` fails if a page under src/app is missing here.
 * Dynamic routes need a concrete sample path, e.g. "/i/sample-token".
 */
export const PAGE_ROUTES = [
  "/",
  "/invite",
  // Neutral token state runs without a database; valid states use personal-invitation.spec.ts.
  "/i/invalid",
  "/order",
  "/checkin",
  "/kitchen",
  "/admin",
  "/admin/sign-in",
  "/admin/sign-out",
  "/admin/mfa",
  "/offline",
  "/dev/theme",
  "/dev",
  "/dev/invitation",
  "/dev/rsvp",
  "/dev/order",
  "/dev/share",
] as const;

/** Any unknown path renders the themed not-found page. */
export const NOT_FOUND_ROUTE = "/this-page-does-not-exist";

/** Pages plus the not-found page: what a guest or staff member can actually land on. */
export const ALL_ROUTES = [...PAGE_ROUTES, NOT_FOUND_ROUTE] as const;

/** Explicit unavailable fixture; every other listed page must still return 200. */
export function expectedRouteStatus(path: string): 200 | 404 {
  return path === "/i/invalid" ? 404 : 200;
}

/** Protected pages stream their redirect after the initial document loads. */
export async function waitForPublicDestination(page: Page, path: string): Promise<void> {
  if (path === "/admin" || path === "/admin/mfa") {
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
    await expect(page.getByLabel("Email address")).toBeVisible();
  }
}
