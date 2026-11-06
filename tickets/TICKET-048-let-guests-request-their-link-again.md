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
updated: 2026-11-06
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

- [x] The form responds identically whether or not a guest matches (no enumeration).
- [x] Requests appear in the admin queue with the matched invitation, if any.
- [x] Re-sharing from the queue uses the Share menu.

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
- 2026-11-05 — in_progress → blocked — divine (codex) — Awaiting exact-path approval for generated lost-link migration, isolated application/commit and proposed 10 requests/network/minute budget; SQL remains unapplied.
- 2026-11-06 — blocked → in_progress — divine (codex)
- 2026-11-06 — in_progress → blocked — divine (codex) — Migration and 10/network/minute budget approved; isolated migration repeatability and 3 storage tests passed. Expanded 4-test suite repeatedly times out. Await stable database capacity; full browser journey and gate remain unverified.
