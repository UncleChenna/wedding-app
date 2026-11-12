---
id: TICKET-145
title: Create the Vercel project and connect the repository
epic: deployment
status: todo
priority: urgent
estimate: L
labels: [human, infra]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-008, TICKET-004, TICKET-125]
blocks: [TICKET-139, TICKET-028, TICKET-149, TICKET-151, TICKET-154, TICKET-160, TICKET-176, TICKET-142, TICKET-150]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-145: Create the Vercel project and connect the repository

## Context

Hosting needs an account decision (Hobby vs Pro) and GitHub integration.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Create project linked to UncleChenna/wedding-app; add both developers; choose plan.
- Merged from TICKET-144 (Create the production Supabase project):
  - Create project in eu-west-2 or nearest; enable PITR/backups per plan; invite both developers.
  - Record plan and cost decision.
- Merged from TICKET-146 (Buy the domain and point it at Vercel with HTTPS):
  - Purchase, DNS to Vercel, HTTPS certificate, www redirect.
- Merged from TICKET-147 (Configure Vercel builds and preview deployments per PR):
  - vercel.ts config (build, crons, headers if needed); Node 24; preview comments on PRs.
- Merged from TICKET-148 (Define and validate environment variables per environment):
  - Table of every variable per environment in docs/deployment.md; set in Vercel; env schema validates at boot.

## Out of scope

- Build config (TICKET-147).

## Acceptance criteria

- [ ] Project exists and a preview deploy runs for a PR (link in notes).
- [ ] (from TICKET-144) Project exists; region and plan recorded in docs/deployment.md.
- [ ] (from TICKET-144) Connection secrets only in Vercel env.
- [ ] (from TICKET-146) https://<domain> serves the app with a valid certificate (curl output in notes).
- [ ] (from TICKET-146) NEXT_PUBLIC_SITE_URL set to the domain in production.
- [ ] (from TICKET-147) A PR gets a working preview URL automatically.
- [ ] (from TICKET-147) Build uses the same pnpm version and lockfile as CI.
- [ ] (from TICKET-148) A missing variable fails the deploy with a clear message (tested via env schema).
- [ ] (from TICKET-148) Docs table matches `.env.example` (test).

## Test plan

- Manual: Account setup.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).
- (TICKET-144) Manual: Account setup.
- (TICKET-146) Manual: DNS setup.
- (TICKET-147) Manual: Preview check.
- (TICKET-148) Unit: Env parity test.

## Files likely touched

- `docs/deployment.md`

## Notes / decisions

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-144, TICKET-146, TICKET-147, TICKET-148 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
