// Throwaway TICKET-102 prototype. Only synthetic files under this scope are cached.
const PREFIX = "/__pwa-spike/";
const CACHE = "ticket-102-prototype-v1";
const PRECACHE = [`${PREFIX}offline.html`];

globalThis.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});
globalThis.addEventListener("activate", (event) => {
  event.waitUntil(globalThis.clients.claim());
});
globalThis.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== globalThis.location.origin ||
    url.search ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch")
  )
    return;
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => (await cache.match(request)) ?? fetch(request)),
    );
  } else if (url.pathname === `${PREFIX}menu.json`) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (response.ok && response.type === "basic" && !response.redirected) {
            await cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw error;
        }
      })(),
    );
  }
});
