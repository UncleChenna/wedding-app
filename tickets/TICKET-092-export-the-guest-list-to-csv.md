---
id: TICKET-092
title: Export the guest list to CSV
epic: admin
status: done
priority: urgent
estimate: S
labels: [backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-089]
blocks: [TICKET-154, TICKET-176]
branch: TICKET-092
pr: https://github.com/UncleChenna/wedding-app/pull/121
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-092: Export the guest list to CSV

## Context

ADM-1 includes export to CSV for the caterer and backups.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-1).

## Scope

- Export of the current filter with RSVP, meals and dietary notes.
- CSV injection-safe.

## Out of scope

- Excel format.

## Acceptance criteria

- [x] Cells starting with = + - @ are escaped (unit).
- [x] Export matches the filtered rows.

## Test plan

- Unit: Escaping.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09 — Filtered private CSV, formula protection and actual download verified with unit tests and two authenticated browser journeys. All-theme accessibility and screenshots pass; final CI remains required.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-089 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-089 (in_review)
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → in_progress — divine (codex) — Resolve merged sent-tracking overlap and reverify CSV plus Undo
