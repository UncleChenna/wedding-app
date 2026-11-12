---
id: TICKET-150
title: Run migrations safely in the deploy pipeline
epic: deployment
status: todo
priority: urgent
estimate: L
labels: [infra, db]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-145, TICKET-149, TICKET-026]
blocks: [TICKET-176, TICKET-179, TICKET-153]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-150: Run migrations safely in the deploy pipeline

## Context

Schema changes must reach staging and production before the code that needs them, without manual SQL.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- GitHub Action applying drizzle migrations to staging on merge and to production on release, with approval.
- Expand/contract guidance for breaking changes.
- Merged from TICKET-152 (Run smoke tests against every deployment):
  - Playwright @smoke against the deployment URL on deployment_status; uses a fixture invitation in staging and read-only checks in production.

## Out of scope

- Data migrations for real guests.

## Acceptance criteria

- [ ] A merged migration applies to staging automatically (run link).
- [ ] Production migration requires manual approval in GitHub environments.
- [ ] (from TICKET-152) A broken deploy fails the smoke workflow and notifies (forced failure proved).
- [ ] (from TICKET-152) Production smoke never writes guest data.

## Test plan

- Manual: Pipeline run.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).
- (TICKET-152) End-to-end: Remote smoke.

## Files likely touched

- `.github/workflows/deploy.yml`
- `docs/deployment.md`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-152 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
