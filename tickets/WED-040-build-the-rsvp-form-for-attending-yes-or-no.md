---
id: WED-040
title: Build the RSVP form for attending yes or no
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [WED-018, WED-023, WED-036, WED-025, WED-035]
blocks: [WED-041, WED-044, WED-126, WED-178, WED-183]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-040: Build the RSVP form for attending yes or no

## Context

Guests confirm attendance from their IV; the buttons and responses use the PRD's wording.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-4) · [Journey 1: receiving the IV and RSVP](../docs/prd.md#journey-1-receiving-the-iv-and-rsvp) · [On the website](../docs/prd.md#on-the-website).

## Scope

- "Count me in" / "I'll be there in spirit" with confirmation states from the PRD.
- Server action with Zod validation; invitation status becomes rsvp_yes or rsvp_no.
- Works without JavaScript (progressive enhancement).

## Out of scope

- Tag-alongs (WED-041), editing lock (WED-042).

## Acceptance criteria

- [ ] Submitting yes/no updates the invitation status and shows the PRD confirmation copy.
- [ ] Invalid or revoked tokens cannot submit (server-side check, tested).
- [ ] Form works with JavaScript disabled (e2e).

## Test plan

- Unit: RSVP action validation.
- End-to-end: Yes and no paths.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/invitations/components/rsvp-form.tsx`
- `src/modules/invitations/server/rsvp.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
