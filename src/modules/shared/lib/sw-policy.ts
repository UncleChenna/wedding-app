/**
 * Service-worker caching policy (ADR 0014, docs/pwa.md). An explicit allowlist:
 * only content-hashed, immutable Next.js build assets are cached. Pages, invitation
 * and pass URLs, admin, APIs, RSC/prefetch requests and mutations always go to the
 * network so no personal or authenticated response is ever stored.
 *
 * `cachePolicy` is embedded verbatim in /sw.js via Function#toString, so it must stay
 * self-contained: no imports, closures or references to anything outside its body.
 */

/**
 * `network-offline-fallback`: page navigations go to the network untouched in content, and
 * only when the network fails is the precached, generic offline page shown. Nothing about
 * the visited page is stored.
 */
export type CachePolicy = "cache-first" | "network-only" | "network-offline-fallback";

export interface PolicyRequest {
  method: string;
  url: string;
  /** The worker's own origin. */
  origin: string;
  headers: { has(name: string): boolean };
  /** Request mode; "navigate" for a page load. */
  mode?: string;
}

/** Bump when cached content or the cache layout changes; older app caches are deleted on activate. */
export const SW_CACHE_VERSION = 1;
export const SW_CACHE_PREFIX = "wedding-";
export const SW_STATIC_CACHE = `${SW_CACHE_PREFIX}static-v${SW_CACHE_VERSION}`;
/** Holds only the public offline page (TICKET-106); never a visited page. */
export const SW_OFFLINE_CACHE = `${SW_CACHE_PREFIX}offline-v${SW_CACHE_VERSION}`;
export const SW_OFFLINE_URL = "/offline";

export function cachePolicy(request: PolicyRequest): CachePolicy {
  if (request.method !== "GET") return "network-only";
  if (request.headers.has("rsc") || request.headers.has("next-router-prefetch")) {
    return "network-only";
  }
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return "network-only";
  }
  if (url.origin !== request.origin) return "network-only";
  if (request.mode === "navigate") return "network-offline-fallback";
  if (url.search) return "network-only";
  // Content-hashed build output (JS, CSS, fonts): immutable, public, safe to keep.
  if (/^\/_next\/static\/[\w./-]+$/.test(url.pathname) && !url.pathname.includes("..")) {
    return "cache-first";
  }
  return "network-only";
}
