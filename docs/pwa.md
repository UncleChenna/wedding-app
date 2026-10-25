# PWA and offline caching

Decision: [ADR 0014](decisions/0014-service-worker.md). This page records what the shipped service worker does today; downstream tickets extend it.

## Service worker

- Served by `src/app/sw.js/route.ts` at `/sw.js` with `Content-Type: application/javascript`, `Cache-Control: no-cache, no-store, must-revalidate` and `Service-Worker-Allowed: /`. Rendered per request (`connection()`), so no prerendered copy with framework cache headers exists.
- Registered at scope `/` with `updateViaCache: "none"` by `ServiceWorkerRegistration` in the root layout, **in production builds only**. Development never installs a worker.
- The fetch rules are `cachePolicy` in `src/modules/shared/lib/sw-policy.ts`. `/sw.js` embeds that exact function, so unit tests and the browser run the same code.
- No automatic `skipWaiting`: a new version waits until tabs using the old one close. TICKET-111 adds the update prompt.
- Caches are named `wedding-<kind>-v<SW_CACHE_VERSION>`. On activate, only obsolete `wedding-` caches are deleted; other caches and IndexedDB (offline queues) are never touched. Bump `SW_CACHE_VERSION` when cached content or layout changes.

## Strategy table

| Request                                                             | Policy                                 | Why                                                                              | Tested by                                        |
| ------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| `GET /_next/static/**` (same origin, no query)                      | **Cache-first** in `wedding-static-v1` | Content-hashed JS, CSS and fonts are immutable and public                        | unit `service-worker.test.ts`; e2e `pwa.spec.ts` |
| Any page HTML (`/`, `/order`, `/checkin`, `/kitchen`, `/dev/theme`) | Network-only                           | Pages can carry personal or live data                                            | unit, e2e cache inspection                       |
| Invitation and pass URLs (`/i/*`, `/p/*`)                           | Network-only                           | Never cache arbitrary invitations; only an authorized own-pass copy (TICKET-107) | unit, e2e                                        |
| Admin (`/admin/**`)                                                 | Network-only                           | Private; must not be readable offline                                            | unit, e2e (offline fetch fails)                  |
| APIs (`/api/**`)                                                    | Network-only                           | Private and live data                                                            | unit, e2e                                        |
| RSC (`rsc` header) and router prefetch (`next-router-prefetch`)     | Network-only                           | Framework payloads may contain personal data and change per deploy               | unit                                             |
| Any non-`GET` (orders, check-ins)                                   | Network-only                           | Mutations use the application outbox (TICKET-066/072/180), never HTTP replay     | unit                                             |
| Requests with a query string, or another origin                     | Network-only                           | Not part of the immutable asset set                                              | unit                                             |
| `/sw.js`                                                            | Network-only                           | The worker must always be fresh                                                  | unit; e2e header check                           |

"Network-only" means the worker does not call `respondWith`: the browser handles the request as if no worker existed, and nothing is stored.

## Planned extensions (not implemented here)

| Content                                   | Ticket     |
| ----------------------------------------- | ---------- |
| Offline fallback page (precached)         | TICKET-106 |
| Guest's own pass, authorized and isolated | TICKET-107 |
| Scanner shell and authorized scanner data | TICKET-108 |
| Update-available prompt                   | TICKET-111 |
| Expiry, logout cleanup, storage eviction  | TICKET-184 |
