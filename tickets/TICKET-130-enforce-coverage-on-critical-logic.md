---
id: TICKET-130
title: Enforce coverage on critical logic
epic: testing
status: in_review
priority: high
estimate: M
labels: [test]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-056, TICKET-058, TICKET-073]
blocks: [TICKET-154]
branch: TICKET-130
pr: https://github.com/UncleChenna/wedding-app/pull/134
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-130: Enforce coverage on critical logic

## Context

Token validation and admission counting are the logic that must never be wrong.

See: [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Vitest coverage thresholds (≥95% lines/branches) for checkin/lib, invitations/lib token, ordering limits.

## Out of scope

- Global thresholds.

## Acceptance criteria

- [x] `pnpm test` fails when critical-module coverage drops below 95%.

## Test plan

- Unit: Coverage config.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `vitest.config.ts`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-09 — Per-file 95% lines/branches now covers all checkin/lib, invitation token, ordering validation and actual extracted limit decisions. Real regressions prove missed branches and unimported files fail even when aggregate coverage exceeds 95%. Integrated develop 7250e483; full pnpm test passes 1,410 tests (156 explicit skips), with 98.54% lines / 99.28% branches overall and every included file above both floors. Actual SQL concurrency/limit suite passes 22 tests on isolated PostgreSQL 16.14 after owned Supabase startup failed; no Supabase/Auth or exact PostgreSQL 17 claim. Owned databases stopped, backup/logs retained. Independent review clean. See docs/plans/TICKET-130-pr.md for evidence and resolved failures. Final CI remains mandatory before merge.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
