---
id: TICKET-058
title: Implement admission rules and partial admission
epic: checkin
status: todo
priority: high
estimate: M
labels: [backend, test]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-024]
blocks: [TICKET-060, TICKET-130, TICKET-173]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-058: Implement admission rules and partial admission

## Context

The logic that must never be wrong: Valid, Already used, Invalid, Revoked, Not RSVP'd; an IV for 4 can admit 2 now and 2 later.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-2, CHK-3) · [Testing plan](../docs/prd.md#testing-plan) · [Data model](../docs/prd.md#data-model).

## Scope

- Pure function: (invitation, prior admissions, token version) → result + remaining allowance.
- Used only when the allowance is reached.
- Shared by server and offline scanner.

## Out of scope

- UI.

## Acceptance criteria

- [ ] Every result type and boundary (0, partial, exact, over-admit) has a unit test; branch coverage 100%.
- [ ] Over-admission is impossible in the function and in the DB constraint.
- [ ] Property test: any sequence of admissions never exceeds count_attending.

## Test plan

- Unit: Exhaustive and property tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/lib/admission.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
