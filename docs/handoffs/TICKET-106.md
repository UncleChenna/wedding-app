# TICKET-106 handoff

## 2026-10-25 — TICKET-106 — Offline fallback page

- **Who / agent / branch:** unclechenna · claude · `TICKET-106`, base `develop` e84a8ca.
- **Changed:**
  - New static `/offline` guest page: `OfflineNotice` plus a client `RetryButton`.
  - `cachePolicy` gains `network-offline-fallback` for same-origin navigations.
  - The worker precaches `/offline` (required) and its assets (best-effort) on install, and serves it only when a navigation's network fetch fails.
  - Activate keeps both current caches.
  - `docs/pwa.md` strategy table updated; `/offline` added to `e2e/support/routes.ts`.
- **Checks:**
  - Unit: 32 worker tests (policy, precache, fallback, failed precache, fetch vs navigation).
  - e2e: offline navigation to a never-visited route, privacy cache inspection.
  - Mutation check: without the fallback the e2e fails.
  - `pnpm verify` passed: 228 unit and 93 browser tests.
  - Screenshots: `artifacts/screenshots/*/{375,768,1280}/offline.png`.
- **Learned:**
  - Node's `Request` cannot be constructed with `mode: "navigate"`; the unit harness overrides `mode` on the instance.
  - Screenshots taken right after `applyTheme` can show the previous theme on transitioning elements (TICKET-195).
- **Next / blockers:**
  - Review and merge.
  - TICKET-107 adds the "open your saved pass" link.
  - TICKET-194/195 are filed.
