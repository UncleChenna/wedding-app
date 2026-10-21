---
id: WED-152
title: Run smoke tests against every deployment
epic: deployment
status: todo
priority: high
estimate: M
labels: [test, infra]
module: shared
owner: ""
agent: ""
blocked_by: [WED-150]
blocks: [WED-153]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-152: Run smoke tests against every deployment

## Context

Each deploy should prove the guest, scanner and board routes work before anyone relies on them.

See: [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Playwright @smoke against the deployment URL on deployment_status; uses a fixture invitation in staging and read-only checks in production.

## Out of scope

- Load tests.

## Acceptance criteria

- [ ] A broken deploy fails the smoke workflow and notifies (forced failure proved).
- [ ] Production smoke never writes guest data.

## Test plan

- End-to-end: Remote smoke.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `.github/workflows/smoke.yml`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
