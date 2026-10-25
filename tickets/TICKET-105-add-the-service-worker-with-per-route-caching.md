---
id: TICKET-105
title: Add the service worker with per-route caching
epic: pwa
status: in_review
priority: urgent
estimate: L
labels: [pwa, frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-102]
blocks: [TICKET-106, TICKET-107, TICKET-108, TICKET-111, TICKET-112, TICKET-124, TICKET-180]
branch: TICKET-105
pr: https://github.com/UncleChenna/wedding-app/pull/21
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-105: Add the service worker with per-route caching

## Context

Caching must be aggressive for the IV/pass and scanner, network-first for live data, and never cache admin or personal data across users.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Strategy table in docs: guest pass and scanner shell cache-first; menu/board/admin network-first or no-store.
- Versioned caches with cleanup.
- CSP worker-src updated.

## Out of scope

- Feature offline data (IndexedDB).

## Acceptance criteria

- [x] Strategy table documented and matched by tests on routes.
- [x] Admin and API responses are never cached (test).
- [x] `pnpm build` and smoke pass with the worker registered.

- [x] Route caching explicitly excludes admin HTML, private API responses and arbitrary invitation pages. Cache only an authorized own-pass copy through TICKET-107 and approved scanner data through TICKET-108.

## Test plan

- Unit: Route matcher.
- End-to-end: Service worker registration.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: switch guest links, log out staff, inspect cache entries and attempt cross-household/private-route offline access.

## Files likely touched

- `src/app/sw.ts`
- `next.config.ts`
- `docs/pwa.md`

## Notes / decisions

- 2026-10-25: Implemented ADR 0014 as an explicit allowlist. Only same-origin, query-free `GET /_next/static/**` (content-hashed, immutable) is cache-first in `wedding-static-v1`; everything else is network-only (the worker never calls respondWith). The policy is a self-contained function embedded verbatim in /sw.js, so the unit-tested code is the shipped code.
- 2026-10-25: /sw.js is a route handler that calls `connection()` so it renders per request; prerendering would attach framework cache headers. Headers: JavaScript content type, `no-cache, no-store, must-revalidate`, `Service-Worker-Allowed: /`. Registration only in production builds, scope `/`, `updateViaCache: none`. No automatic skipWaiting (TICKET-111). Activate deletes only obsolete `wedding-` caches, never other caches or IndexedDB.
- 2026-10-25: Precaching of the offline page and scanner shell is left to TICKET-106/108 (nothing to precache exists yet); versioned caches and cleanup are implemented and tested now.
- 2026-10-25: Audit verification: e2e visits admin, an arbitrary invitation URL, order, check-in and an API URL, then inspects Cache Storage: only /_next/static entries. Offline, a cached asset loads and /admin fails rather than being served from cache. Staff logout and cross-household pass checks need auth and the own-pass copy (TICKET-030/107/184); not testable yet.
- 2026-10-25: Evidence: 19 unit tests (policy matrix plus the served script run in a sandboxed worker global: handlers, cache-first only for assets, no skipWaiting, cleanup scope). 4 browser tests on mobile and desktop. `pnpm verify` passed on develop 67aaea4: 197 unit tests, build, 40 browser tests.
- 2026-10-25: Also filed TICKET-192 for the PR #20 review nits.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
- 2026-10-25 — in_progress → in_review — unclechenna (claude)
