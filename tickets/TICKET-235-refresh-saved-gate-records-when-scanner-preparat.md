---
id: TICKET-235
title: Refresh saved gate records when scanner preparation completes
epic: checkin
status: done
priority: high
estimate: S
labels: [frontend, test]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-184]
blocks: []
branch: TICKET-235
pr: https://github.com/UncleChenna/wedding-app/pull/182
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-235: Refresh saved gate records when scanner preparation completes

## Context

TICKET-132's real signed camera journey shows a transient saved-records failure before worker preparation completes. Retrying after preparation succeeds without resetting storage. See [Gate check-in](../docs/prd.md#gate-check-in).

## Scope

- Distinguish initial preparation from confirmed storage failure in the existing saved-records panel.
- Refresh status when the worker/controller and snapshot become ready, preserving generation and unmount guards.

## Out of scope

- Queue format changes, weaker eviction checks, or automatic storage reset.

## Acceptance criteria

- [x] Fresh scanner visits show a preparation state rather than a premature storage-failure warning.
- [x] Completion of real worker preparation refreshes saved-record status without manual retry.
- [x] Real unavailable or inconsistent storage still fails closed and retains retry guidance.
- [x] Existing TICKET-132 camera regression retains exact healthy-record assertions after readiness.

## Test plan

- Unit: initial preparation, readiness event, failure and unmount races.
- Browser: actual first-visit worker preparation and healthy saved-record status without retry; preserve camera verdict checks.

## Files likely touched

- `src/modules/checkin/components/offline-queue-status.tsx`, readiness event producers and focused tests.

## Notes / decisions

- 2026-11-13 — Reserved separately from TICKET-231 after independent actual-browser evidence; no queue data loss was observed.

- 2026-11-13 — Implemented bounded preparing state and readiness refresh with original generation guards.23 focused unit tests and real mobile/desktop camera regression pass; original queue failures remain unavailable. See `docs/plans/TICKET-235-pr.md`.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → done — divine (codex)
