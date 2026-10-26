import "server-only";

import {
  cachePolicy,
  SW_CACHE_PREFIX,
  SW_OFFLINE_CACHE,
  SW_OFFLINE_URL,
  SW_STATIC_CACHE,
} from "../lib/sw-policy";

/**
 * Source of /sw.js. Embeds the unit-tested `cachePolicy` verbatim so the browser runs the
 * exact rules in docs/pwa.md. No automatic skipWaiting: a new worker waits until every tab
 * using the old one closes (TICKET-111 adds the update prompt).
 */
export function serviceWorkerSource(): string {
  return `"use strict";
const SW_CACHE_PREFIX = ${JSON.stringify(SW_CACHE_PREFIX)};
const SW_STATIC_CACHE = ${JSON.stringify(SW_STATIC_CACHE)};
const SW_OFFLINE_CACHE = ${JSON.stringify(SW_OFFLINE_CACHE)};
const SW_OFFLINE_URL = ${JSON.stringify(SW_OFFLINE_URL)};
const cachePolicy = ${cachePolicy.toString()};

/** Same-origin, query-free build asset paths referenced by a page or stylesheet. */
const STATIC_ASSET = /^\\/_next\\/static\\/[\\w./-]+$/;
function assetUrls(text, base) {
  const urls = new Set();
  for (const match of text.matchAll(/(?:src|href)="([^"]+)"|url\\(\\s*["']?([^"')\\s]+)/g)) {
    try {
      const url = new URL(match[1] || match[2], base);
      if (url.origin === self.location.origin && !url.search && STATIC_ASSET.test(url.pathname)) {
        urls.add(url.pathname);
      }
    } catch {
      // Not a URL.
    }
  }
  return [...urls];
}

/** Best-effort: a missing asset leaves the offline page plainer, never uninstallable. */
async function precacheAsset(cache, path) {
  try {
    const response = await fetch(path);
    if (response.status !== 200) return;
    if (path.endsWith(".css")) {
      const css = await response.clone().text();
      const base = new URL(path, self.location.origin).href;
      await Promise.all(assetUrls(css, base).map((font) => precacheAsset(cache, font)));
    }
    await cache.put(path, response);
  } catch {
    // Offline or storage full: the asset is fetched normally next time.
  }
}

self.addEventListener("install", (event) => {
  // The offline page itself is required; its build assets are best-effort.
  // (Scanner shell: TICKET-108.)
  event.waitUntil(
    (async () => {
      const response = await fetch(SW_OFFLINE_URL, { cache: "reload" });
      if (response.status !== 200) throw new Error("offline page unavailable");
      const html = await response.clone().text();
      await (await caches.open(SW_OFFLINE_CACHE)).put(SW_OFFLINE_URL, response);
      const statics = await caches.open(SW_STATIC_CACHE);
      await Promise.all(
        assetUrls(html, self.location.origin).map((path) => precacheAsset(statics, path)),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith(SW_CACHE_PREFIX) &&
              name !== SW_STATIC_CACHE &&
              name !== SW_OFFLINE_CACHE,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const policy = cachePolicy({
    method: request.method,
    url: request.url,
    origin: self.location.origin,
    headers: request.headers,
    mode: request.mode,
  });
  if (policy === "network-offline-fallback") {
    event.respondWith(
      fetch(request).catch(async () => {
        try {
          const page = await (await caches.open(SW_OFFLINE_CACHE)).match(SW_OFFLINE_URL);
          if (page) return page;
        } catch {
          // Cache Storage unavailable: fall through to the browser's own error.
        }
        return Response.error();
      }),
    );
    return;
  }
  if (policy !== "cache-first") return; // network-only: the browser handles it untouched
  event.respondWith(
    (async () => {
      // Caching is best-effort: storage errors must never fail the page's request.
      try {
        const cached = await (await caches.open(SW_STATIC_CACHE)).match(request);
        if (cached) return cached;
      } catch {
        // Cache Storage unavailable (private mode, quota, eviction): use the network.
      }
      const response = await fetch(request);
      // Only complete responses: 206 partial (range) responses cannot be stored.
      if (response.status === 200 && response.type === "basic" && !response.redirected) {
        const copy = response.clone();
        event.waitUntil(
          caches
            .open(SW_STATIC_CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined),
        );
      }
      return response;
    })(),
  );
});
`;
}

/** /sw.js must never be cached itself, so updates are always noticed. */
export function serviceWorkerResponse(): Response {
  return new Response(serviceWorkerSource(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
