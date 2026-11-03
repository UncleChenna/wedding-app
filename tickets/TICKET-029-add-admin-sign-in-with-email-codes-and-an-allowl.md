---
id: TICKET-029
title: Add admin sign-in with email codes and an allowlist
epic: data-auth
status: in_review
priority: urgent
estimate: M
labels: [backend, security, frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-017, TICKET-025]
blocks: [TICKET-030, TICKET-125]
branch: TICKET-029
pr: https://github.com/UncleChenna/wedding-app/pull/53
created: 2026-10-21
updated: 2026-10-28
started: 2026-10-28
completed: ""
reason: ""
resume_to: ""
---

# TICKET-029: Add admin sign-in with email codes and an allowlist

## Context

Admins (the couple and optionally the planner) sign in by email; only allowlisted addresses may become admins.

See: [Users and roles](../docs/prd.md#users-and-roles) · [Security](../docs/prd.md#security).

## Scope

- Supabase Auth email OTP via `@supabase/ssr`.
- Allowlist of admin emails in settings/env.
- Sign-in and sign-out pages using shared components.

## Out of scope

- TOTP 2FA (TICKET-030).
- Route protection (TICKET-032).

## Acceptance criteria

- [x] An allowlisted email can sign in with a code; any other email is refused with a friendly message.
- [x] Sessions use httpOnly cookies; no tokens in localStorage.
- [x] Unit tests for the allowlist check; e2e sign-in against local Inbucket.

## Test plan

- Unit: Allowlist logic.
- End-to-end: Sign in via local mail catcher.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/app/(admin)/`
- `src/modules/shared/server/supabase/`

## Notes / decisions

2026-10-28: Implemented server-only email codes and exact allowlist, httpOnly sessions and accessible sign-in/sign-out pages. Local Mailpit (formerly described here as Inbucket) real email flow passed on mobile and desktop, including wrong/replayed codes and sign-out. Full verify passed: 449 browser checks, 123 conditional skips. All four themes reviewed at 375/768/1280; see docs/reviews/TICKET-029/README.md. Hosted email setup, route guards and MFA remain separate launch requirements.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-28 — todo → claimed — divine (codex)
- 2026-10-28 — todo → in_progress — divine (codex)
- 2026-10-28 — in_progress → in_review — divine (codex)
