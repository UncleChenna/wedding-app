---
id: TICKET-141
title: Add request ids and structured logs to server actions
epic: observability
status: in_progress
priority: medium
estimate: S
labels: [backend]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-141
pr: https://github.com/UncleChenna/wedding-app/pull/13
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
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

- [x] Each server action log line has a request id (unit).
- [x] Tokens are redacted in logs (unit).

## Test plan

- Unit: Logger tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/lib/logger.ts`

## Notes / decisions

- 2026-10-21: Added server-only runLoggedAction with validated incoming request ID or UUID, request-local child logs, safe lifecycle records and unchanged handler return/throw behavior. Request IDs cannot be overridden by later fields/children; objects beyond the redaction depth limit are truncated rather than emitted raw. Initial logger regressions: 2 failed / 5 passed. Focused suite: 17 passed. Quick/full gates: 116 unit tests, production build, 17 smoke passes, 7 existing skips. No feature Server Actions exist yet; docs/observability.md requires future actions to use the helper and explains safe fields and redaction limits.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
- 2026-10-21 — in_review → in_progress — divine (codex) — Resolve remaining PR conflicts with develop
