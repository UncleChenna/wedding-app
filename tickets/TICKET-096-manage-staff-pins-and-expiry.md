---
id: TICKET-096
title: Manage staff, PINs and expiry
epic: admin
status: todo
priority: high
estimate: M
labels: [frontend, backend, security]
module: admin
owner: ""
agent: ""
blocked_by: [TICKET-031, TICKET-088, TICKET-034]
blocks: [TICKET-086, TICKET-129, TICKET-134, TICKET-166]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-096: Manage staff, PINs and expiry

## Context

ADM-4: staff PIN management; PINs expire after the event.

See: [Admin dashboard](../docs/prd.md#admin-dashboard) (ADM-4) · [Security](../docs/prd.md#security).

## Scope

- Staff CRUD with role, WhatsApp number, expiry.
- Generate and show a PIN once; reset; revoke sessions.

## Out of scope

- Alert opt-in UI (TICKET-086).

## Acceptance criteria

- [ ] A PIN is shown once and only its hash is stored (unit).
- [ ] Revoking a staff member signs out their devices within 1 minute (e2e).

## Test plan

- Unit: PIN lifecycle.
- End-to-end: Create staff and sign in.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
