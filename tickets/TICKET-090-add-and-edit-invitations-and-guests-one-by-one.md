---
id: TICKET-090
title: Add and edit invitations and guests one by one
epic: admin
status: in_progress
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-049, TICKET-089, TICKET-036]
blocks: [TICKET-091, TICKET-182]
branch: TICKET-090
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-090: Add and edit invitations and guests one by one

## Context

INV-1: admin adds guests one by one (name, phone, email, party size, side, table).

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-1).

## Scope

- Create/edit form with Zod validation; token generated on create.
- Delete only drafts; otherwise revoke.

## Out of scope

- Bulk import.

## Acceptance criteria

- [ ] Creating an invitation generates a token and draft status (unit).
- [ ] Invalid phone/email show field errors (e2e).

## Test plan

- Unit: Validation.
- End-to-end: Create and edit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-089 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-089 (in_review)
