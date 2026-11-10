---
id: TICKET-065
title: Cache the guest list and revocations on each scanner
epic: checkin
status: in_progress
priority: high
estimate: L
labels: [frontend, pwa]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-043, TICKET-061, TICKET-108]
blocks: [TICKET-063, TICKET-066, TICKET-068, TICKET-184]
branch: TICKET-065
pr: https://github.com/UncleChenna/wedding-app/pull/147
created: 2026-10-21
updated: 2026-11-10
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-065: Cache the guest list and revocations on each scanner

## Context

With no signal at all, scanners must know names, party sizes, tables, admissions and revocations.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Connectivity plan](../docs/prd.md#connectivity-plan-signal-unknown) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- IndexedDB snapshot downloaded at sign-in and refreshed in the background.
- Minimal fields only (no contact details or dietary notes).
- Freshness indicator ("list updated 3 min ago").

## Out of scope

- Queueing check-ins (TICKET-066).

## Acceptance criteria

- [x] With the network disabled after sign-in, scans of valid, used and revoked codes give correct results (e2e offline).
- [x] The cache contains no email, phone or dietary data (test).
- [x] Signing out clears the cache.

- [x] Show snapshot age and apply TICKET-169 maximum freshness, expiry and changed-party policy. Do not claim disconnected revocations are immediate.

## Test plan

- Unit: Snapshot reducer.
- End-to-end: Playwright `context.setOffline(true)`.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: stale and expired snapshots, reissue while offline, refresh and missing storage.

## Files likely touched

- `src/modules/checkin/lib/offline-store.ts`

## Notes / decisions

2026-11-10: Functional criteria verified with authenticated offline browser2/2, real worker24/24, isolated PostgreSQL projection and existing admission/offline-shell integrations. Full coverage1873pass; checkpoint b9a511d6 all seven CI checks passed. Integrated develop7533201c adds verified062/225: combined build, SQL5/5, snapshot2/2 and admission/logging2/2 pass; all144 screenshots unchanged. Fresh combined CI remains pending. Private snapshots never record admissions or touch queues. Physical release checks remain114/163/201.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-061 (in_progress)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-061 (in_progress)
- 2026-11-10 — in_progress → in_review — divine (codex)
- 2026-11-10 — in_review → in_progress — divine (codex) — Integrate verified TICKET-062 scan logging and TICKET-225 harness fixes before final combined verification
- 2026-11-10 — in_review → in_progress — divine (codex) — Fix reviewed admission-refusal cache invalidation gap before merge
