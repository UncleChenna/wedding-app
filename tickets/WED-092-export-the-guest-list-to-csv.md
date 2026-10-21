---
id: WED-092
title: Export the guest list to CSV
epic: admin
status: todo
priority: urgent
estimate: S
labels: [backend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-089]
blocks: [WED-154, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-092: Export the guest list to CSV

## Context

ADM-1 includes export to CSV for the caterer and backups.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-1).

## Scope

- Export of the current filter with RSVP, meals and dietary notes.
- CSV injection-safe.

## Out of scope

- Excel format.

## Acceptance criteria

- [ ] Cells starting with = + - @ are escaped (unit).
- [ ] Export matches the filtered rows.

## Test plan

- Unit: Escaping.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
