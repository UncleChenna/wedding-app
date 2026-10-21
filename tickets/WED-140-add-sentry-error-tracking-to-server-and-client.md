---
id: WED-140
title: Add Sentry error tracking to server and client
epic: observability
status: todo
priority: high
estimate: M
labels: [infra, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-139]
blocks: [WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-140: Add Sentry error tracking to server and client

## Context

See errors live on the day without exposing guest data.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- @sentry/nextjs per installed Next 16 docs; scrub PII (names, phones, tokens).
- Release tagging with the commit SHA.

## Out of scope

- Performance tracing beyond defaults.

## Acceptance criteria

- [ ] A test error from server and client appears in Sentry with release SHA (screenshot).
- [ ] Event payloads contain no tokens or contact details (beforeSend test).

## Test plan

- Unit: Scrubber tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/instrumentation.ts`
- `src/instrumentation-client.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
