---
id: WED-162
title: Train ushers and caterers on their screens
epic: launch
status: todo
priority: high
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [WED-055, WED-154, WED-161]
blocks: [WED-163]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-162: Train ushers and caterers on their screens

## Context

Staff walkthrough: ushers and caterers each use their screen for 10 minutes before the day.

See: [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Sessions on their own devices; issue PINs; install the PWA.

## Out of scope

- Rehearsal (WED-163).

## Acceptance criteria

- [ ] Every staff member scanned or moved an order themselves (attendance list in notes).

## Test plan

- Manual: Training session.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
