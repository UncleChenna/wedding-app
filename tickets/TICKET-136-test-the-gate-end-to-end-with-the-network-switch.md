---
id: TICKET-136
title: Test the gate end to end with the network switched off
epic: testing
status: done
priority: high
estimate: M
labels: [test, pwa]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-066, TICKET-067, TICKET-108, TICKET-063, TICKET-062, TICKET-184]
blocks: [TICKET-154, TICKET-163]
branch: TICKET-136
pr: https://github.com/UncleChenna/wedding-app/pull/181
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-136: Test the gate end to end with the network switched off

## Context

Hardening: a full check-in test with the network off is a PRD milestone.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Scripted: sign in, go offline, reload, scan 50 codes on two contexts, reconnect, verify counts and conflicts.

## Out of scope

- Real devices (TICKET-163).

## Acceptance criteria

- [x] Two disconnected scanners retain every scan report across reload and reconcile duplicate event retries without duplicate canonical admissions.
- [x] Over-allowance reports remain visible conflicts: four allowed and eight reported yields four canonical admissions, eight reports and a resolvable conflict.
- [x] Invalid/used/revoked scans, stale snapshots, expired devices and quota failure follow TICKET-169/TICKET-184; no silent evidence loss.

## Test plan

- End-to-end: Offline gate spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `e2e/offline-gate.spec.ts`

## Notes / decisions

2026-11-13: Actual two-context mobile/desktop 50-code rehearsal passes. Exact original100 event IDs survive reload and retry; shared8 reported/4 admitted/1 conflict, total56 reported/52 admitted. Existing40 browser fault cases and33 policy tests pass. See docs/plans/TICKET-136-pr.md and docs/reviews/TICKET-136/ for evidence. Physical devices remain TICKET-163.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
