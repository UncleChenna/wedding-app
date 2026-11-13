---
id: TICKET-235
title: Refresh saved gate records when scanner preparation completes
epic: checkin
status: in_progress
priority: high
estimate: S
labels: [frontend, test]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-184]
blocks: []
branch: TICKET-235
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
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

- [ ] Fresh scanner visits show a preparation state rather than a premature storage-failure warning.
- [ ] Completion of real worker preparation refreshes saved-record status without manual retry.
- [ ] Real unavailable or inconsistent storage still fails closed and retains retry guidance.
- [ ] Existing TICKET-132 camera regression retains exact healthy-record assertions after readiness.

## Test plan

- Unit: initial preparation, readiness event, failure and unmount races.
- Browser: actual first-visit worker preparation and healthy saved-record status without retry; preserve camera verdict checks.

## Files likely touched

- `src/modules/checkin/components/offline-queue-status.tsx`, readiness event producers and focused tests.

## Notes / decisions

- 2026-11-13 — Reserved separately from TICKET-231 after independent actual-browser evidence; no queue data loss was observed.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
