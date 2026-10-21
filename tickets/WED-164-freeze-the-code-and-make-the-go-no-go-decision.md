---
id: WED-164
title: Freeze the code and make the go/no-go decision
epic: launch
status: todo
priority: high
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [WED-117, WED-118, WED-129, WED-142, WED-163, WED-154, WED-159, WED-160, WED-158, WED-005]
blocks: [WED-165]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-164: Freeze the code and make the go/no-go decision

## Context

Milestone: finish at least 2 weeks before the wedding so the last stretch is rehearsal, not coding.

See: [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing).

## Scope

- Tag the release; restrict merges to critical fixes; go/no-go meeting.

## Out of scope

- New features.

## Acceptance criteria

- [ ] Go/no-go recorded with the release tag and open risks.
- [ ] Branch protection limits merges to fix tickets until after the wedding.

- [ ] Freeze at least two weeks before the approved wedding date; unresolved mandatory checks, scope decisions or device failures mean no-go. Record owner, date, deployed commit and exception decisions explicitly.

## Test plan

- Manual: Decision meeting.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: reconcile all prerequisite evidence including late wording checks; do not treat dependency points as calendar estimates.

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
