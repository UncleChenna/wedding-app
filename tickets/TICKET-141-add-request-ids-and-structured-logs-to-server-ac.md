---
id: TICKET-141
title: Add request ids and structured logs to server actions
epic: observability
status: todo
priority: medium
estimate: S
labels: [backend]
module: shared
owner: ""
agent: ""
blocked_by: []
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-141: Add request ids and structured logs to server actions

## Context

Correlating a guest complaint with logs needs request ids on every action.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Request id from headers or generated; logger child per request; redact tokens.

## Out of scope

- Log shipping.

## Acceptance criteria

- [ ] Each server action log line has a request id (unit).
- [ ] Tokens are redacted in logs (unit).

## Test plan

- Unit: Logger tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/lib/logger.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
