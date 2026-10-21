---
id: TICKET-049
title: Normalise guest phone numbers for wa.me links
epic: sharing
status: todo
priority: urgent
estimate: S
labels: [backend]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-023]
blocks: [TICKET-050, TICKET-086, TICKET-090]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-049: Normalise guest phone numbers for wa.me links

## Context

wa.me opens a chat only with a full international number; guest lists will contain UK local formats and spaces.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-3).

## Scope

- Pure E.164 normaliser with a UK default country.
- Validation messages for unusable numbers.

## Out of scope

- Phone verification.

## Acceptance criteria

- [ ] `07700 900123`, `+44 7700 900123` and `447700900123` normalise to `+447700900123` (unit).
- [ ] Invalid numbers return a typed error, not an exception.

## Test plan

- Unit: Table-driven normaliser tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/lib/phone.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
