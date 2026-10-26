/**
 * Every page the app serves, for checks that must cover the whole site (accessibility,
 * overflow). `e2e/a11y-routes.spec.ts` fails if a page under src/app is missing here.
 * Dynamic routes need a concrete sample path, e.g. "/i/sample-token".
 */
export const PAGE_ROUTES = [
  "/",
  "/invite",
  "/order",
  "/checkin",
  "/kitchen",
  "/admin",
  "/offline",
  "/dev/theme",
  "/dev",
  "/dev/invitation",
  "/dev/rsvp",
  "/dev/order",
] as const;

/** Any unknown path renders the themed not-found page. */
export const NOT_FOUND_ROUTE = "/this-page-does-not-exist";

/** Pages plus the not-found page: what a guest or staff member can actually land on. */
export const ALL_ROUTES = [...PAGE_ROUTES, NOT_FOUND_ROUTE] as const;
