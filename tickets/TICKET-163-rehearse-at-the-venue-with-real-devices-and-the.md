---
id: TICKET-163
title: Rehearse at the venue with real devices and the network off
epic: launch
status: todo
priority: high
estimate: M
labels: [human, test]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-114, TICKET-136, TICKET-137, TICKET-156, TICKET-162]
blocks: [TICKET-164]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-163: Rehearse at the venue with real devices and the network off

## Context

Week 8: dry run with real staff and devices at the venue; scan from screens at full and low brightness in the actual lighting, on venue Wi-Fi and 4G.

See: [Milestones, scope and testing](../docs/prd.md#milestones-scope-and-testing) · [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Follow the release-checklist skill; record timings, failures and fixes.

## Out of scope

- Code changes beyond fixes.

## Acceptance criteria

- [ ] Release-checklist report recorded; every failure has a fix merged or an accepted workaround.

## Test plan

- Manual: Venue rehearsal.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/runbook.md`
- `docs/audits/`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
