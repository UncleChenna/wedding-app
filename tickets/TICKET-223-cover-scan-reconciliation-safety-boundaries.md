---
id: TICKET-223
title: Cover scan reconciliation safety boundaries
epic: checkin
status: in_progress
priority: urgent
estimate: S
labels: [test]
module: checkin
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-223
pr: ""
created: 2026-11-09
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-223: Cover scan reconciliation safety boundaries

## Context

Merged TICKET-173 introduces scan-sync.ts below the per-file95% line/branch gate,
blocking TICKET-059 CI. Preserve [Gate check-in](../docs/prd.md#gate-check-in)
CHK-3/CHK-6 reconciliation safety while adding meaningful missing-path regressions.

## Scope

- Reproduce the exact coverage failure on current develop.
- Test schema rejection and defensive reconciliation boundaries, without changing
  admission policy or excluding files from coverage.

## Out of scope

- Scanner UI, schema migrations, runtime behavior changes and new database services.

## Acceptance criteria

- [ ] Missing reconciliation branches have behavioral tests, including defensive invalid counts and canonical refusal outcomes.
- [ ] Full pnpm test passes unchanged per-file95% lines/branches thresholds, including scan-sync.ts.
- [ ] verify:quick and final required CI pass; independent review confirms no weakened assertions or production policy changes.

## Test plan

- Unit: reproduce focused coverage failure, add edge cases, rerun full coverage suite.
- Gate: verify:quick and full hosted CI before merge.
- UI/database: N/A for pure test additions; no new DB operation needed.

## Files likely touched

- src/modules/checkin/__tests__/scan-sync.test.ts
- docs/plans/TICKET-223-pr.md

## Notes / decisions

2026-11-09: Assigned shared CI repair; TICKET-060 paused with draftPR139 preserved.

## Activity log

- 2026-11-09 — new → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
