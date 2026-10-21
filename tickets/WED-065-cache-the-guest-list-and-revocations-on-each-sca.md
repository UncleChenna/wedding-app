---
id: WED-065
title: Cache the guest list and revocations on each scanner
epic: checkin
status: todo
priority: high
estimate: L
labels: [frontend, pwa]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-043, WED-061, WED-108]
blocks: [WED-063, WED-066, WED-068, WED-184]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-065: Cache the guest list and revocations on each scanner

## Context

With no signal at all, scanners must know names, party sizes, tables, admissions and revocations.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- IndexedDB snapshot downloaded at sign-in and refreshed in the background.
- Minimal fields only (no contact details or dietary notes).
- Freshness indicator ("list updated 3 min ago").

## Out of scope

- Queueing check-ins (WED-066).

## Acceptance criteria

- [ ] With the network disabled after sign-in, scans of valid, used and revoked codes give correct results (e2e offline).
- [ ] The cache contains no email, phone or dietary data (test).
- [ ] Signing out clears the cache.

- [ ] Show snapshot age and apply WED-169 maximum freshness, expiry and changed-party policy. Do not claim disconnected revocations are immediate.

## Test plan

- Unit: Snapshot reducer.
- End-to-end: Playwright `context.setOffline(true)`.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: stale and expired snapshots, reissue while offline, refresh and missing storage.

## Files likely touched

- `src/modules/checkin/lib/offline-store.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
