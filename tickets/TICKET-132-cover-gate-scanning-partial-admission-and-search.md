---
id: TICKET-132
title: Cover gate scanning, partial admission and search end to end
epic: testing
status: todo
priority: high
estimate: L
labels: [test]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-062, TICKET-063, TICKET-066, TICKET-067, TICKET-108, TICKET-184]
blocks: [TICKET-154, TICKET-163]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-132: Cover gate scanning, partial admission and search end to end

## Context

Journey 2 must never break.

See: [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Fake camera scans for every result type, partial admission, manual search.
- Merged from TICKET-136 (Test the gate end to end with the network switched off):
  - Scripted: sign in, go offline, reload, scan 50 codes on two contexts, reconnect, verify counts and conflicts.

## Out of scope

- Offline (TICKET-136).

## Acceptance criteria

- [ ] All five result types and partial admission pass in CI.
- [ ] (from TICKET-136) Two disconnected scanners retain every scan report across reload and reconcile duplicate event retries without duplicate canonical admissions.
- [ ] (from TICKET-136) Over-allowance reports remain visible conflicts: four allowed and eight reported yields four canonical admissions, eight reports and a resolvable conflict.
- [ ] (from TICKET-136) Invalid/used/revoked scans, stale snapshots, expired devices and quota failure follow TICKET-169/TICKET-184; no silent evidence loss.

## Test plan

- End-to-end: Gate spec.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).
- (TICKET-136) End-to-end: Offline gate spec.

## Files likely touched

- `e2e/gate.spec.ts`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-136 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
