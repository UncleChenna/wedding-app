---
id: WED-030
title: Require TOTP two-factor auth for admin accounts
epic: data-auth
status: todo
priority: high
estimate: M
labels: [security, backend, frontend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-029]
blocks: [WED-032]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-030: Require TOTP two-factor auth for admin accounts

## Context

The PRD requires 2FA for admin access.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- Enrol TOTP with QR + manual secret; verify; recovery guidance.
- Admin routes require AAL2.

## Out of scope

- SMS 2FA.

## Acceptance criteria

- [ ] An admin without a verified factor is sent to enrolment and cannot reach admin pages.
- [ ] AAL1 sessions are rejected by every admin server action (tested).
- [ ] Enrolment works at 375px.

## Test plan

- Unit: AAL check helper.
- End-to-end: Enrol and verify with a generated TOTP.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/app/(admin)/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
