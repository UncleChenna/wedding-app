---
id: TICKET-091
title: Import guests from CSV with a validation preview
epic: admin
status: done
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-090, TICKET-182]
blocks: [TICKET-134, TICKET-176, TICKET-177]
branch: TICKET-091
pr: https://github.com/UncleChenna/wedding-app/pull/125
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-091: Import guests from CSV with a validation preview

## Context

The real list (200–300 guests) arrives as a spreadsheet.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-1).

## Scope

- Preview and confirm TICKET-182 validated imports in the admin UI; parsing, duplicate handling and transactional writes are TICKET-182.

## Out of scope

- Spreadsheet sync.

## Acceptance criteria

- [x] A 300-row CSV imports in one transaction (unit).
- [x] Rows with errors are shown and nothing is written until fixed.
- [x] Re-importing the same file creates no duplicates.

- [x] Use TICKET-182 preview/commit service; show row-specific errors and duplicate decisions and disable commit until the preview is valid.

## Test plan

- Unit: Parser and dedupe.
- End-to-end: Upload fixture CSV.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: invalid CSV preview, corrected upload, repeat submit and unchanged pre-existing RSVP.

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09: Connected the protected Guests → Import page to merged TICKET-182. Mobile and desktop production-browser flows pass (21.5s final): invalid rows/contact conflicts write nothing; 300 guests import; replay adds no duplicate; existing RSVP status/count/time remains unchanged. Atomic transaction behavior is covered by TICKET-182’s merged database tests.
- 2026-11-09: Fixed cold-load file selection before hydration and expiry during an in-flight commit with RED/GREEN regressions. Build and quick verification pass (122 related tests, one isolated-DB test skipped by quick mode); actual browser/database flow runs separately. Four-theme screenshots/axe and responsive checks recorded in docs/plans/TICKET-091-pr.md. Full final-head CI remains required before merge.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-182 (in_progress)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-182 (in_progress)
- 2026-11-09 — in_progress → in_review — divine (codex)
