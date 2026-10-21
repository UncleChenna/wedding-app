---
id: WED-061
title: Admit arriving guests with partial counts
epic: checkin
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-024, WED-060]
blocks: [WED-062, WED-063, WED-065, WED-068, WED-097]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-061: Admit arriving guests with partial counts

## Context

Staff tap Admit and enter how many people arrived; the IV is used only when its allowance is reached.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-3) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Stepper defaulting to remaining allowance.
- Idempotent server action keyed by client_event_id.
- Immediate visual confirmation.

## Out of scope

- Offline queue (WED-066).

## Acceptance criteria

- [ ] Admitting 2 of 4 leaves 2 remaining; a second scan shows Valid with 2 remaining (e2e).
- [ ] Retrying the same client_event_id creates no duplicate (unit).
- [ ] Over-admit is refused with a clear message.

## Test plan

- Unit: Action idempotency.
- End-to-end: Partial admission flow.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
