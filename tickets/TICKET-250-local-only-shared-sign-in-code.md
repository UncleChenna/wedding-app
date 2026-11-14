---
id: TICKET-250
title: Add a local-only shared sign-in code for admin and staff
epic: foundations
status: done
priority: medium
estimate: S
labels: [backend, security, dx]
module: shared
owner: UncleChenna
agent: claude
blocked_by: []
blocks: []
branch: TICKET-250
pr: "#218"
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: ""
resume_to: ""
---

# TICKET-250: Add a local-only shared sign-in code for admin and staff

## Context

Requested by the owner: one default code that signs anyone in on a local setup (admin email code,
admin authenticator code, and every staff PIN), so the site can be explored without a mail inbox,
an authenticator app or issued PINs. It must never work on the live site.

## Scope

- `000000` (or `LOCAL_SIGN_IN_CODE`, six digits; `off` disables) accepted at the admin email-code
  step, the admin authenticator step and every staff station PIN.
- Refused unless all hold: not on Vercel, the database and Supabase are on this machine, and the
  browser is on localhost.
- The real flows still run: local Supabase issues and verifies a genuine email code and checks a
  genuine authenticator code; staff sign in as a per-station "Local … tester" with a real session.

## Out of scope

- Any production or staging sign-in shortcut. The admin email allowlist still applies.

## Acceptance criteria

- [x] `000000` completes admin sign-in and two-step setup locally (e2e).
- [x] `000000` opens the kitchen, bar and gate stations locally (e2e).
- [x] A wrong code is still refused (e2e).
- [x] The code is refused on Vercel, with a non-local database or Supabase, or from a non-localhost
      host (unit).

## Test plan

- Unit: `src/modules/shared/__tests__/local-sign-in.test.ts`.
- End-to-end: `e2e/local-sign-in.spec.ts` (run command in the file header).

## Files likely touched

- `src/modules/shared/lib/local-sign-in.ts`, `src/modules/shared/server/local-sign-in.ts`
- Admin auth and MFA actions, staff sign-in action and `staff-auth.ts`

## Notes / decisions

- 2026-11-13: The guard needs four independent local signals, so a deployed site fails it even if
  `LOCAL_SIGN_IN_CODE` were set there. Each use logs a warning. The TOTP helper moved from
  `e2e/support` to `src/modules/shared/lib/totp.ts` (the e2e path re-exports it).

## Activity log

- 2026-11-13 — new → in_review — UncleChenna (claude) — requested by the owner
