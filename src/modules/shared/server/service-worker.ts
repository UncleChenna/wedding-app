import "server-only";

import { cachePolicy, SW_CACHE_PREFIX, SW_STATIC_CACHE } from "../lib/sw-policy";

/**
 * Source of /sw.js. Embeds the unit-tested `cachePolicy` verbatim so the browser runs the
 * exact rules in docs/pwa.md. No automatic skipWaiting: a new worker waits until every tab
 * using the old one closes (TICKET-111 adds the update prompt).
 */
export function serviceWorkerSource(): string {
  return `"use strict";
const SW_CACHE_PREFIX = ${JSON.stringify(SW_CACHE_PREFIX)};
const SW_STATIC_CACHE = ${JSON.stringify(SW_STATIC_CACHE)};
const cachePolicy = ${cachePolicy.toString()};

self.addEventListener("install", (event) => {
  // Nothing to precache yet (offline page: TICKET-106; scanner shell: TICKET-108).
  event.waitUntil(caches.open(SW_STATIC_CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(SW_CACHE_PREFIX) && name !== SW_STATIC_CACHE)
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
  });
  if (policy !== "cache-first") return; // network-only: the browser handles it untouched
  event.respondWith(
    (async () => {
      const cache = await caches.open(SW_STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic" && !response.redirected) {
        await cache.put(request, response.clone());
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
