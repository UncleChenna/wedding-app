# Ticket

Ticket: TICKET-105

# Summary

The offline gate, the guest's own pass and installability all need a service worker. The worker must never store personal data: invitation pages, admin, APIs and framework payloads can all contain it.

This PR ships the production worker decided in ADR 0014. It's a small custom worker with an **explicit allowlist**:

- Only content-hashed, immutable Next.js build assets (`/_next/static/**`) are cached (cache-first).
- Everything else goes straight to the network and is never stored: pages, invitation and pass URLs, admin, APIs, RSC and prefetch requests, mutations, query strings and other origins.

The rules are one unit-tested function that the served `/sw.js` embeds verbatim, so tests and browsers run the same code.

# Changes

- **`src/modules/shared/lib/sw-policy.ts`** (new):
  - `cachePolicy(request)` returns `cache-first` or `network-only`. It's self-contained, so it can be embedded with `Function#toString`, and a comment explains why.
  - `SW_CACHE_VERSION` and cache names (`wedding-static-v1`).
- **`src/modules/shared/server/service-worker.ts`** (new, `server-only`):
  - Builds the worker source:
    - install opens the versioned cache;
    - activate deletes only obsolete `wedding-` caches, never other caches or IndexedDB, then `clients.claim()`;
    - fetch calls `respondWith` only for `cache-first`, and caches only `ok`, `basic`, non-redirected responses.
  - No automatic `skipWaiting`. TICKET-111 owns the update prompt.
  - Response headers: `application/javascript`, `no-cache, no-store, must-revalidate`, `Service-Worker-Allowed: /`.
- **`src/app/sw.js/route.ts`** (new): calls `await connection()` so `/sw.js` renders per request. Under Cache Components a plain GET handler would be prerendered with framework cache headers (per the installed Next 16 route-handler docs).
- **`src/modules/shared/components/service-worker-registration.tsx`** (new client component), mounted in `src/app/layout.tsx`:
  - registers `/sw.js` at scope `/` with `updateViaCache: "none"`;
  - only when `NODE_ENV === "production"`, per ADR 0014, so development never installs a worker;
  - a failure to register is silent, and the site works without the worker.
- **`docs/pwa.md`** (new): the strategy table (request type, policy, reason and which test covers it), lifecycle rules, and the planned extensions with their owning tickets.
- **Tests:**
  - `src/modules/shared/__tests__/service-worker.test.ts`: 19 unit tests. The policy matrix covers assets, every page type, invitation and pass URLs, admin, APIs, `/sw.js`, POST, RSC, prefetch, query strings, other origins and `..` paths.
  - The same file runs the **exact served script** in a sandboxed worker global. It asserts the three handlers, cache-first only for assets with nothing else stored, no `skipWaiting`, and that activate deletes only obsolete app caches.
  - `e2e/pwa.spec.ts` (new, `@smoke`, mobile and desktop):
    - `/sw.js` headers;
    - registration at root scope controlling the page;
    - after visiting `/admin`, an invitation URL, `/order`, `/checkin`, `/dev/theme` and an `/api` URL, Cache Storage holds only `/_next/static` entries;
    - offline, a cached asset still loads but `/admin` fails instead of being served from cache.
- **Also in this PR:** `tickets/TICKET-192-…md`, a ticket definition only, covering the PR #20 review nits.
- **Integration:** merged `develop` 67aaea4 (TICKET-019 and 191). No conflicts.

# Acceptance criteria and evidence

- [x] **Strategy table documented and matched by tests on routes.** `docs/pwa.md` lists every request class with the test that covers it; the unit matrix covers each row.
- [x] **Admin and API responses are never cached (test).**
  - Unit: `/admin`, `/admin/guests` and `/api/*` are network-only, and the sandboxed worker never calls `respondWith` for them.
  - Browser: after visiting them, Cache Storage holds only `/_next/static` entries, and offline `/admin` fails.
- [x] **`pnpm build` and smoke pass with the worker registered.** The production build lists `ƒ /sw.js`, and the full smoke suite passes with the worker registered and controlling pages.
- [x] **Route caching excludes admin HTML, private API responses and arbitrary invitation pages; the own-pass copy is left to TICKET-107 and scanner data to TICKET-108.** Covered by the unit matrix and the browser cache inspection, including `/i/not-a-real-token`. Nothing private is cached.

# Verification

- New unit tests failed first (modules missing). 19 pass now.
- One test fix: Node's constructed `Response` has `type: "default"`, while real same-origin browser responses are `"basic"`. The fake `fetch` now returns `basic`. The worker's "cache only basic responses" rule is unchanged.
- Browser: `e2e/pwa.spec.ts` passed 4 of 4 on mobile and desktop, alongside smoke and a11y (22 tests in that run).
- `pnpm verify` after integrating `develop` 67aaea4: passed. 192 tickets valid, format, lint, typecheck, 197 unit tests (22 files), production build, 40 browser tests.
- **Not verified (owned by later tickets):**
  - staff logout cache clearing and cross-household pass isolation, which need auth and the own-pass copy (TICKET-030, 107 and 184);
  - iOS Safari and WebKit worker behaviour, and installed-app behaviour (TICKET-113 and 114);
  - update flow across versions (TICKET-111 and 180).

# Risks and rollout

- **Every production page load now registers a worker.** It only answers `/_next/static` requests, so worst case a stale asset can't be served: asset URLs are content-hashed and every deploy uses new names.
- **Rollback:** a removed registration doesn't uninstall an installed worker, as ADR 0014 notes. To roll back safely, deploy a `/sw.js` that keeps the same URL and does nothing; the next PR can do that. Do not just delete the route.
- **Cache growth:** old hashed assets accumulate in `wedding-static-v1` until `SW_CACHE_VERSION` is bumped. Eviction and expiry belong to TICKET-184.

# Screenshots

N/A: no visible UI. The registration component renders nothing.

# UI checklist

- [x] **Screenshots:** N/A, no visible UI change (renders `null`).
- [x] **Tokens:** N/A.
- [x] **Restraint and typography:** N/A.
- [x] **Mobile:** N/A for layout. Mobile e2e confirms registration and offline behaviour.
- [x] **Motion:** N/A.
- [x] **Keyboard:** N/A.
- [x] **Contrast:** N/A.
- [x] **Load and images:** No layout shift. The registration runs in an effect after hydration and doesn't block render.
- [x] **Performance:** Adds one tiny client component (no UI). Lighthouse is measured later on real guest pages (TICKET-129).
- [x] **Copy:** N/A.
- [x] **Shared components:** N/A.
- [x] **Sharing and devices:** Real-device install and offline checks are TICKET-114.
- [x] **QR codes:** N/A.
- [x] **Staff feedback:** N/A.
- [x] **Verification:** `pnpm verify` passed.

# Harness changes, if any

- New `e2e/pwa.spec.ts` in the smoke suite. No hook changes.
