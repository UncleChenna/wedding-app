---
id: TICKET-261
title: Explain why the local sign-in code failed
epic: foundations
status: in_review
priority: medium
estimate: S
labels: [backend, dx]
module: shared
owner: "UncleChenna"
agent: ""
blocked_by: []
blocks: []
branch: "TICKET-261"
pr: "#227"
created: 2026-11-15
updated: 2026-11-15
started: 2026-11-15
completed: ""
reason: ""
resume_to: ""
---

# TICKET-261: Explain why the local sign-in code failed

## Context

The local-only code `000000` (TICKET-250) fell back silently whenever a local step failed, so the
admin saw only "That code couldn't be verified". On the owner's machine the real cause was a local
database from an old version of the app, which took a long time to find.

## Scope

- When `000000` is typed off Vercel but refused, log which setting refuses it (never its value).
- When a local step fails, log the step and what to fix: empty or mismatched `SUPABASE_JWT_SECRET`,
  local Supabase down, an out-of-date local database, missing `STAFF_SESSION_SECRET`, or event
  settings that block the local staff tester.
- README: where to look when `000000` is rejected.

## Out of scope

- Any change to when the code is accepted.

## Acceptance criteria

- [x] Each failure above produces one warning naming the cause.
- [x] Logs never contain secrets, database URLs, email addresses or raw errors.
- [x] Ordinary codes and Vercel deployments log nothing new.

## Test plan

- Unit: `local-sign-in.test.ts` (refusal reasons) and `local-sign-in-diagnostics.test.ts`.

## Activity log

- 2026-11-15 — new → in_review — PR opened
