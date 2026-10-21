---
id: TICKET-031
title: Add staff PIN sign-in with hashed, expiring PINs
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-172, TICKET-025, TICKET-169]
blocks: [TICKET-027, TICKET-032, TICKET-033, TICKET-059, TICKET-064, TICKET-076, TICKET-096, TICKET-173, TICKET-185]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-031: Add staff PIN sign-in with hashed, expiring PINs

## Context

Gate, kitchen and bar staff use PINs on dedicated pages; PINs expire after the event and attempts are rate-limited.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- 6-digit PINs hashed with scrypt; constant-time compare.
- Signed, httpOnly staff session cookie bound to role and device.
- 5 failed attempts per device per 10 minutes, then lockout.

## Out of scope

- Staff management UI (TICKET-096).

## Acceptance criteria

- [ ] Wrong PIN, expired PIN and locked-out device each return a distinct friendly state (tested).
- [ ] PIN hashes never leave the server; the session holds role and staff id only.
- [ ] A gate PIN cannot open the kitchen board and vice versa.

## Test plan

- Unit: Hashing, expiry and lockout.
- End-to-end: PIN entry on /checkin.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/staff-auth.ts`
- `src/app/(staff)/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
