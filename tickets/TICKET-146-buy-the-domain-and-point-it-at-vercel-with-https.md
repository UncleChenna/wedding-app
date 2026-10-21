---
id: TICKET-146
title: Buy the domain and point it at Vercel with HTTPS
epic: deployment
status: todo
priority: urgent
estimate: S
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-008, TICKET-145]
blocks: [TICKET-028, TICKET-094, TICKET-154, TICKET-160, TICKET-176]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-146: Buy the domain and point it at Vercel with HTTPS

## Context

Guest links and the printed table QR depend on the final domain; it must exist before IVs are shared.

See: [Open questions](../docs/prd.md#open-questions) · [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Purchase, DNS to Vercel, HTTPS certificate, www redirect.

## Out of scope

- Email DNS beyond the login provider.

## Acceptance criteria

- [ ] https://<domain> serves the app with a valid certificate (curl output in notes).
- [ ] NEXT_PUBLIC_SITE_URL set to the domain in production.

## Test plan

- Manual: DNS setup.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
