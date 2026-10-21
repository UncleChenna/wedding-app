---
id: TICKET-028
title: Set up the email provider for admin login codes
epic: data-auth
status: todo
priority: urgent
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-144, TICKET-146]
blocks: [TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-028: Set up the email provider for admin login codes

## Context

Admin login sends one-time codes by email; Supabase's default SMTP is rate-limited and not for production. Needs an account (Resend free tier suggested).

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Create the account; verify a sending domain or subdomain.
- Add SMTP credentials to Supabase (production) via the dashboard, never the repo.

## Out of scope

- Guest emails (IVs go through the Share menu).

## Acceptance criteria

- [ ] A test login code arrives at both admin addresses from the production project.
- [ ] Credentials live only in Supabase/Vercel settings (checked: not in git).

## Test plan

- Manual: Send a test code to each admin.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
