---
id: TICKET-106
title: Add an offline fallback page
epic: pwa
status: in_progress
priority: high
estimate: S
labels: [pwa, frontend]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-105]
blocks: [TICKET-113]
branch: TICKET-106
pr: ""
created: 2026-10-21
updated: 2026-10-25
started: 2026-10-25
completed: ""
reason: ""
resume_to: ""
---

# TICKET-106: Add an offline fallback page

## Context

Uncached navigations offline should land on a warm, useful page.

See: [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown).

## Scope

- Themed offline page linking to the cached pass if present.

## Out of scope

- Offline ordering.

## Acceptance criteria

- [x] Offline navigation to an uncached route shows the offline page (e2e).

## Test plan

- End-to-end: Offline navigation.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/offline/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-10-25 (unclechenna): `/offline` is a static guest page (no guest data). The worker precaches it on install into `wedding-offline-v1`, together with its build assets and CSS fonts (best-effort). Same-origin navigations get `network-offline-fallback`: the network as normal, and the offline page only when the fetch fails. `fetch()` calls are not navigations, so `/admin` still fails offline.
  - **e2e:** offline navigation to the never-visited `/i/never-opened-token` shows the styled page, and "Try again" recovers once online.
  - **Mutation check:** without the fallback, the test fails with `ERR_INTERNET_DISCONNECTED`.
  - **Not done here:** the scope's "link to the cached pass if present" depends on TICKET-107, which defines the saved pass; that ticket's planned-extensions row now says to add the link.
  - **Filed:** TICKET-195 (screenshots captured mid-transition after a theme swap) and TICKET-194 (`t:new` burns an id on invalid input).

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-25 — todo → claimed — unclechenna (claude)
- 2026-10-25 — todo → in_progress — unclechenna (claude)
