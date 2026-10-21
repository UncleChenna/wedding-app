---
id: WED-051
title: Mark invitations as sent when shared
epic: sharing
status: todo
priority: urgent
estimate: S
labels: [backend, frontend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-050, WED-089]
blocks: [WED-053, WED-159, WED-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-051: Mark invitations as sent when shared

## Context

Sharing marks the IV as sent so the couple knows who still needs one.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-3).

## Scope

- Status draft → sent and sent_at on first share; each share logged with channel.
- Undo for mis-taps.

## Out of scope

- Delivery receipts (not possible without a provider).

## Acceptance criteria

- [ ] Sharing through any channel sets status sent and sent_at once (unit).
- [ ] The guest list filters by sent / not sent.

- [ ] First-send timestamp is separate from RSVP status. Re-sharing preserves yes/no responses and revocation; cancelling native share does not mark sent, and opening an external intent is not proof of delivery.

## Test plan

- Unit: Status transition.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit: first share, repeat share after RSVP, revoked invitation and native-share cancellation; assert no RSVP mutation.

## Files likely touched

- `src/modules/admin/server/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
