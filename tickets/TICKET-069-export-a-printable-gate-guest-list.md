---
id: TICKET-069
title: Export a printable gate guest list
epic: checkin
status: in_review
priority: high
estimate: S
labels: [frontend, backend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-024, TICKET-088]
blocks: [TICKET-161, TICKET-165]
branch: TICKET-069
pr: https://github.com/UncleChenna/wedding-app/pull/123
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-069: Export a printable gate guest list

## Context

Fallback: a printed guest list at the gate, exported the morning of the wedding.

See: [Performance and reliability](../docs/prd.md#performance-and-reliability).

## Scope

- Admin action producing a print-optimised page/PDF sorted by surname: name, party size, table, admitted-so-far boxes.

## Out of scope

- Printing logistics (TICKET-165).

## Acceptance criteria

- [x] The export includes every rsvp_yes invitation and every tag-along name (unit).
- [x] Prints on A4 in black and white without cut-off columns (manual print preview).

## Test plan

- Unit: Export rows.
- Manual: Print preview.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/modules/checkin/`

## Notes / decisions

2026-11-09: Added protected `/admin/guests/print` with a consistent confirmed-invitation snapshot, every companion, canonical party/admission totals and printable A4 output. Eight focused tests and authenticated browser/PDF checks prove both criteria. Free-form names use the primary guest’s final name word for sorting; this limitation is disclosed on the page. See `docs/plans/TICKET-069-pr.md` for evidence and remaining release checks.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
