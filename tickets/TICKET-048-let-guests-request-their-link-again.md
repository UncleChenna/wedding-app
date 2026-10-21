---
id: TICKET-048
title: Let guests request their link again
epic: invitations
status: todo
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: ""
agent: ""
blocked_by: [TICKET-036, TICKET-088, TICKET-050, TICKET-185]
blocks: [TICKET-123, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-048: Let guests request their link again

## Context

INV-5 includes "resend link on request". IVs only go out through the admin's own WhatsApp or email, so a request must reach the admin.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-5).

## Scope

- Public form: name + phone or email (rate-limited, no account lookup leak).
- Admin queue of requests with a one-tap re-share.

## Out of scope

- Automatic sending.

## Acceptance criteria

- [ ] The form responds identically whether or not a guest matches (no enumeration).
- [ ] Requests appear in the admin queue with the matched invitation, if any.
- [ ] Re-sharing from the queue uses the Share menu.

## Test plan

- Unit: Matching and response neutrality.
- End-to-end: Submit request; appears in admin.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/lost-link/`
- `src/modules/invitations/server/`
- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
