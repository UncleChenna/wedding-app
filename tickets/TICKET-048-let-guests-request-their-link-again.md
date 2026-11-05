---
id: TICKET-048
title: Let guests request their link again
epic: invitations
status: in_progress
priority: urgent
estimate: M
labels: [frontend, backend]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-036, TICKET-088, TICKET-050, TICKET-185]
blocks: [TICKET-123, TICKET-176]
branch: TICKET-048
pr: ""
created: 2026-10-21
updated: 2026-11-05
started: 2026-11-05
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

2026-11-05: Claimed and isolated on fresh develop c9c9e66. Draft PR103 publishes validation, conservative matching and neutral submission service foundations. All 21 focused tests and verify:quick pass. Persistence, form/admin UI, full integration and UI review remain incomplete; see docs/handoffs/TICKET-048.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-05 — todo → claimed — divine (codex)
- 2026-11-05 — todo → in_progress — divine (codex)
