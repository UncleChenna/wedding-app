---
id: WED-165
title: Export and print the gate guest list on the morning
epic: launch
status: todo
priority: medium
estimate: S
labels: [human]
module: ops
owner: ""
agent: ""
blocked_by: [WED-069, WED-164]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-165: Export and print the gate guest list on the morning

## Context

Fallback: printed guest list at the gate, exported the morning of the wedding.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Export, print two copies, hand to the gate lead with the runbook.

## Out of scope

- Digital fallback.

## Acceptance criteria

- [ ] Two printed copies exist and the export time is recorded in notes.

## Test plan

- Manual: Print.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
