---
id: WED-031
title: Add staff PIN sign-in with hashed, expiring PINs
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-172, WED-025, WED-169]
blocks: [WED-027, WED-032, WED-033, WED-059, WED-064, WED-076, WED-096, WED-173, WED-185]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-031: Add staff PIN sign-in with hashed, expiring PINs

## Context

Gate, kitchen and bar staff use PINs on dedicated pages; PINs expire after the event and attempts are rate-limited.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- 6-digit PINs hashed with scrypt; constant-time compare.
- Signed, httpOnly staff session cookie bound to role and device.
- 5 failed attempts per device per 10 minutes, then lockout.

## Out of scope

- Staff management UI (WED-096).

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
