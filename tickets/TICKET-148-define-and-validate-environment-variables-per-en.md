---
id: TICKET-148
title: Define and validate environment variables per environment
epic: deployment
status: cancelled
priority: urgent
estimate: M
labels: [infra, security]
module: shared
owner: ""
agent: ""
blocked_by: [TICKET-125, TICKET-144, TICKET-147, TICKET-245]
blocks: [TICKET-150, TICKET-154, TICKET-176, TICKET-250]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-11-12
started: ""
completed: ""
reason: "Merged into TICKET-145 (TICKET-228)"
resume_to: ""
---

# TICKET-148: Define and validate environment variables per environment

## Context

Preview and production need different databases, keys and site URLs, validated at boot.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Table of every variable per environment in docs/deployment.md; set in Vercel; env schema validates at boot.

## Out of scope

- Secret rotation (TICKET-125).

## Acceptance criteria

- [ ] A missing variable fails the deploy with a clear message (tested via env schema).
- [ ] Docs table matches `.env.example` (test).

## Test plan

- Unit: Env parity test.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `docs/deployment.md`
- `.env.example`

## Notes / decisions

2026-11-13: TICKET-245 implements the offline explicit release-profile validator and documentation parity. Every existing acceptance criterion remains: set the correct provider scopes, wire the explicit check into the deployment step, prove missing configuration blocks that deployment, and verify real startup. Existing rotation/provider prerequisites remain unchanged; synthetic local tests are not deployment evidence.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-12 — todo → cancelled — unclechenna (claude) — merged into TICKET-145 (TICKET-228)
