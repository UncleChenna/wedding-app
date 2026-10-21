---
id: WED-091
title: Import guests from CSV with a validation preview
epic: admin
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-090, WED-182]
blocks: [WED-134, WED-176, WED-177]
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

- Preview and confirm WED-182 validated imports in the admin UI; parsing, duplicate handling and transactional writes are WED-182.

## Out of scope

- Spreadsheet sync.

## Acceptance criteria

- [ ] A 300-row CSV imports in one transaction (unit).
- [ ] Rows with errors are shown and nothing is written until fixed.
- [ ] Re-importing the same file creates no duplicates.

- [ ] Use WED-182 preview/commit service; show row-specific errors and duplicate decisions and disable commit until the preview is valid.

## Test plan

- Unit: Parser and dedupe.
- End-to-end: Upload fixture CSV.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: invalid CSV preview, corrected upload, repeat submit and unchanged pre-existing RSVP.

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
