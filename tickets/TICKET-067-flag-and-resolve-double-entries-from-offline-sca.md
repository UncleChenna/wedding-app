---
id: TICKET-067
title: Flag and resolve double entries from offline scanners
epic: checkin
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: ""
agent: ""
blocked_by: [TICKET-066, TICKET-033, TICKET-088]
blocks: [TICKET-136, TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-067: Flag and resolve double entries from offline scanners

## Context

Two offline devices can admit the same IV; the system must flag the over-admission and show who, when and where.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6).

## Scope

- Server marks conflicting admissions beyond allowance.
- Gate and admin conflict list with device and staff details.
- Resolution notes.

## Out of scope

- Automatic reversal.

## Acceptance criteria

- [ ] Two devices each admitting 4 of 4 offline produce one flagged conflict after sync (unit + e2e).
- [ ] The conflict appears on every scanner within 2 seconds of sync.

## Test plan

- Unit: Conflict detection.
- End-to-end: Two-context offline test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
