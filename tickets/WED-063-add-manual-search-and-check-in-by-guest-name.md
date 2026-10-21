---
id: WED-063
title: Add manual search and check-in by guest name
epic: checkin
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-061]
blocks: [WED-132]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-063: Add manual search and check-in by guest name

## Context

Guests without a phone are found by name and checked in manually.

See: [Gate check-in](../docs/prd.md#gate-check-in) (CHK-4) · [Journey 2: check-in at the gate](../docs/prd.md#journey-2-check-in-at-the-gate).

## Scope

- Accent- and typo-tolerant search over primary and tag-along names (works offline from the cache).
- Same admission flow and logging as a scan.

## Out of scope

- Editing guests at the gate.

## Acceptance criteria

- [ ] Searching "Adebayo", "adebayo" and "Adébayo" finds the same guest (unit).
- [ ] Manual check-in is logged with result `manual`.
- [ ] Results are readable at arm's length (≥18px).

## Test plan

- Unit: Search normalisation.
- End-to-end: Search and admit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
