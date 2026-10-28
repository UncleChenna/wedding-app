---
id: TICKET-030
title: Require TOTP two-factor auth for admin accounts
epic: data-auth
status: in_progress
priority: urgent
estimate: M
labels: [security, backend, frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-029]
blocks: [TICKET-032]
branch: TICKET-030
pr: ""
created: 2026-10-21
updated: 2026-10-28
started: 2026-10-28
completed: ""
reason: ""
resume_to: ""
---

# TICKET-030: Require TOTP two-factor auth for admin accounts

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
- 2026-10-28 — todo → claimed — divine (codex)
- 2026-10-28 — todo → in_progress — divine (codex)
