---
id: TICKET-105
title: Add the service worker with per-route caching
epic: pwa
status: todo
priority: urgent
estimate: L
labels: [pwa, frontend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-102]
blocks: [TICKET-106, TICKET-107, TICKET-108, TICKET-111, TICKET-112, TICKET-124, TICKET-180]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
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

- [ ] Strategy table documented and matched by tests on routes.
- [ ] Admin and API responses are never cached (test).
- [ ] `pnpm build` and smoke pass with the worker registered.

- [ ] Route caching explicitly excludes admin HTML, private API responses and arbitrary invitation pages. Cache only an authorized own-pass copy through TICKET-107 and approved scanner data through TICKET-108.

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

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
