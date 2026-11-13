---
id: TICKET-090
title: Add and edit invitations and guests one by one
epic: admin
status: done
priority: urgent
estimate: M
labels: [frontend, backend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-049, TICKET-089, TICKET-036]
blocks: [TICKET-091, TICKET-182]
branch: TICKET-090
pr: https://github.com/UncleChenna/wedding-app/pull/120
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

- [x] Creating an invitation generates a token and draft status (unit).
- [x] Invalid phone/email show field errors (e2e).

## Test plan

- Unit: Validation.
- End-to-end: Create and edit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

- 2026-11-09: Implemented authenticated household/member create/edit, stale-state and admission guards, admin-attributed RSVP corrections and historical check-in preservation. Draft deletion redirects to a focused guest-list confirmation. 19 focused unit tests, 6 isolated database tests, production build and 2 authenticated browser journeys pass; full evidence in docs/plans/TICKET-090-pr.md. PR #120; CI and final integration pending.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex) — started ahead of TICKET-089 (in_review)
- 2026-11-09 — todo → in_progress — divine (codex) — started ahead of TICKET-089 (in_review)
- 2026-11-09 — in_progress → in_review — divine (codex)
