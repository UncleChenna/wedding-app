---
id: TICKET-262
title: Simplify admin sign-in to email verification
epic: foundations
status: in_review
priority: high
estimate: S
labels: [backend]
module: admin
owner: UncleChenna
blocked_by: []
blocks: []
branch: TICKET-262
pr: ""
created: 2026-11-15
updated: 2026-11-15
---

# TICKET-262: Simplify admin sign-in to email verification

## Scope

Owner requested deferring authenticator setup and challenges. Keep verified email sessions,
allowlisting, live identity checks and private response headers. Preserve existing factors.

## Acceptance criteria

- [x] Email verification grants admin page and action access without TOTP.
- [x] Legacy MFA URL redirects to dashboard after authentication.
- [x] Anonymous, expired, unlisted and mismatched identities remain denied.

## Test plan

Unit access matrix, browser email-to-dashboard journey, full verification.

## Verification

Full `pnpm verify` passed: formatting, lint, types, 2147 tests (237 skipped), and production build.
Local browser and independent review evidence: `docs/reviews/TICKET-262/sign-in.md`.
