---
id: TICKET-100
title: Show each invitation's RSVP change history
epic: admin
status: done
priority: medium
estimate: S
labels: [frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-042, TICKET-089]
blocks: [TICKET-154]
branch: TICKET-100
pr: https://github.com/UncleChenna/wedding-app/pull/128
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: 2026-11-09
reason: ""
resume_to: ""
---

# TICKET-100: Show each invitation's RSVP change history

## Context

INV-6: admin sees each change with a timestamp.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-6).

## Scope

- Timeline per invitation from rsvp_changes.

## Out of scope

- Undo.

## Acceptance criteria

- [x] Every change for a seeded invitation is listed newest first with time (e2e).

## Test plan

- End-to-end: History view.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09: Added the protected per-invitation timeline with guest-list entry and return links. Real isolated browser evidence proves all three deliberately out-of-order seeded records appear newest first with UTC timestamps. Independent review corrected meal UUID display: current menu labels are identified explicitly, missing menu records remain honest. See docs/plans/TICKET-100-pr.md for privacy, accessibility, tests and limitations.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
- 2026-11-09 — in_progress → in_review — divine (codex)
- 2026-11-09 — in_review → done — divine (codex)
