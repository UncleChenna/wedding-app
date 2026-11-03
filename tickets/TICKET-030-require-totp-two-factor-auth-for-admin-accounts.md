---
id: TICKET-030
title: Require TOTP two-factor auth for admin accounts
epic: data-auth
status: in_review
priority: urgent
estimate: M
labels: [security, backend, frontend]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-029]
blocks: [TICKET-032]
branch: TICKET-030
pr: https://github.com/UncleChenna/wedding-app/pull/54
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

- [x] An admin without a verified factor is sent to enrolment and cannot reach admin pages.
- [x] AAL1 sessions are rejected by the privileged admin operation boundary (tested); email sign-in/sign-out and MFA bootstrap are explicit exceptions with no wedding-data access.
- [x] Enrolment works at 375px.

## Test plan

- Unit: AAL check helper.
- End-to-end: Enrol and verify with a generated TOTP.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/admin/`
- `src/app/(admin)/`

## Notes / decisions

2026-10-28: Implemented live identity/claims/allowlist/AAL2 checks and protected content rendering. Clarified the action criterion: requiring AAL2 for the actions that establish AAL2 would prevent enrolment; bootstrap actions never access privileged wedding data. Sixteen boundary tests and real local email/TOTP browser checks pass. All-theme screenshots and item-by-item review are in docs/reviews/TICKET-030/README.md. Physical iOS/Android authenticator scanning and native keyboard QA remain unverified; no release approval claimed. Final gate and PR pending.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-28 — todo → claimed — divine (codex)
- 2026-10-28 — todo → in_progress — divine (codex)
- 2026-10-28 — in_progress → in_review — divine (codex)
