# TICKET-105 handoff

## 2026-10-25 — TICKET-105 — Service worker with allowlist caching

- **Who / agent / branch:** unclechenna · claude · `TICKET-105`, integrated with `develop` 67aaea4.
- **Changed:**
  - `/sw.js` route: rendered per request, with no-cache headers.
  - `cachePolicy`: cache-first only for `/_next/static`; everything else network-only.
  - Production-only registration at scope `/`.
  - Versioned caches with scoped cleanup; no automatic skipWaiting.
  - `docs/pwa.md` strategy table.
  - Filed TICKET-192.
- **Checks:**
  - 19 unit tests, including the served script run in a sandboxed worker.
  - 4 browser tests on mobile and desktop: headers, root scope, cache contents, offline behaviour.
  - `pnpm verify` passed: 197 unit tests, build, 40 browser tests.
- **Learned:**
  - With Cache Components a plain GET route is prerendered; call `connection()` when response headers must hold.
  - Node's `Response.type` is "default", not "basic"; fake it in unit tests.
- **Next / blockers:** Review and merge into develop. Unblocks TICKET-106 (offline page), 107 (own pass), 108 (scanner shell) and 111 (update prompt).
