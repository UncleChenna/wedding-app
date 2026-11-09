// Search-engine privacy (TICKET-120). Personal invitations, passes, ordering, staff, admin and
// previews must never be indexed. Shared links still need their Open Graph previews, so personal
// pages (/i, /p) are kept out of search with a noindex header rather than robots.txt: a
// robots.txt block would also stop link-preview crawlers reading the page.

// Same value src/proxy.ts sets, so a route covered by both still sends one consistent header.
export const NOINDEX_VALUE = "noindex, nofollow";

/** Route prefixes that are never indexed. Matched as `/<prefix>` and `/<prefix>/...`. */
export const PRIVATE_ROUTE_PREFIXES = [
  "i",
  "p",
  "order",
  "offline",
  "staff",
  "checkin",
  "kitchen",
  "bar",
  "admin",
  "dev",
  "invitation-preview",
  "api",
] as const;

/** Paths robots.txt disallows: staff, admin and tooling, which no outside crawler needs. */
export const ROBOTS_DISALLOW = [
  "/staff",
  "/checkin",
  "/kitchen",
  "/bar",
  "/admin",
  "/dev",
  "/api",
] as const;

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

export function noindexHeaderRules(): HeaderRule[] {
  const header = [{ key: "X-Robots-Tag", value: NOINDEX_VALUE }];
  return PRIVATE_ROUTE_PREFIXES.flatMap((prefix) => [
    { source: `/${prefix}`, headers: header },
    { source: `/${prefix}/:path*`, headers: header },
  ]);
}

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`),
  );
}
