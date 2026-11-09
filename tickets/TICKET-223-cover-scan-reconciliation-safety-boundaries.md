---
id: TICKET-223
title: Cover scan reconciliation safety boundaries
epic: checkin
status: in_review
priority: urgent
estimate: S
labels: [test]
module: checkin
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-223
pr: https://github.com/UncleChenna/wedding-app/pull/143
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

- [x] Missing reconciliation branches have behavioral tests, including defensive invalid counts and canonical refusal outcomes.
- [x] Full pnpm test passes unchanged per-file95% lines/branches thresholds, including scan-sync.ts.
- [x] verify:quick passes; independent review confirms no weakened assertions or production policy changes. Final required CI remains the mandatory merge gate.

## Test plan

- Unit: reproduce focused coverage failure, add edge cases, rerun full coverage suite.
- Gate: verify:quick and full hosted CI before merge.
- UI/database: N/A for pure test additions; no new DB operation needed.

## Files likely touched

- src/modules/checkin/__tests__/scan-sync.test.ts
- docs/plans/TICKET-223-pr.md

## Notes / decisions

2026-11-09: Assigned shared CI repair; TICKET-060 paused with draftPR139 preserved.
Reproduced92.3%lines/83.33%branches;19focused regressions now100%both.
Full unchanged suite:1483passed/178skipped,98.66%lines/99.31%branches in101.89s.
Quick lint/types/19related tests pass; independent review clean. Initial final CI passed all six jobs. External PR141 then merged the narrow fix;
integrated develop3e75175e retaining both assertions. Full1484passed/178skipped
in147.96s, identical coverage and quick pass; independent resolution review clean.
New final CI pending.

## Activity log

- 2026-11-09 — new → todo — divine
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → in_progress — divine (codex) — Integrate verified external PR141 coverage assertion while retaining broader reconciliation regressions.
