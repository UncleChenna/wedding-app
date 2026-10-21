---
id: WED-029
title: Add admin sign-in with email codes and an allowlist
epic: data-auth
status: todo
priority: urgent
estimate: M
labels: [backend, security, frontend]
module: admin
owner: ""
agent: ""
blocked_by: [WED-025]
blocks: [WED-030, WED-125]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-029: Add admin sign-in with email codes and an allowlist

## Context

Admins (the couple and optionally the planner) sign in by email; only allowlisted addresses may become admins.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- Supabase Auth email OTP via `@supabase/ssr`.
- Allowlist of admin emails in settings/env.
- Sign-in and sign-out pages using shared components.

## Out of scope

- TOTP 2FA (WED-030).
- Route protection (WED-032).

## Acceptance criteria

- [ ] An allowlisted email can sign in with a code; any other email is refused with a friendly message.
- [ ] Sessions use httpOnly cookies; no tokens in localStorage.
- [ ] Unit tests for the allowlist check; e2e sign-in against local Inbucket.

## Test plan

- Unit: Allowlist logic.
- End-to-end: Sign in via local mail catcher.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/app/(admin)/`
- `src/modules/shared/server/supabase/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
