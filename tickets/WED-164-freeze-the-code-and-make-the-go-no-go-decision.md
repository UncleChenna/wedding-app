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
blocked_by: [WED-117, WED-129, WED-142, WED-163]
blocks: [WED-165, WED-166]
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

## Test plan

- Manual: Decision meeting.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
