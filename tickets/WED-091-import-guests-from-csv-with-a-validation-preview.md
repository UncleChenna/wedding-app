---
id: WED-091
title: Import guests from CSV with a validation preview
epic: admin
status: todo
priority: high
estimate: L
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-090]
blocks: [WED-134, WED-154, WED-157]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-091: Import guests from CSV with a validation preview

## Context

The real list (200–300 guests) arrives as a spreadsheet.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-1).

## Scope

- Columns: name, phone, email, party size, side, table.
- Preview with per-row errors and duplicates before commit; all-or-nothing import.
- Template CSV download.

## Out of scope

- Spreadsheet sync.

## Acceptance criteria

- [ ] A 300-row CSV imports in one transaction (unit).
- [ ] Rows with errors are shown and nothing is written until fixed.
- [ ] Re-importing the same file creates no duplicates.

## Test plan

- Unit: Parser and dedupe.
- End-to-end: Upload fixture CSV.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
