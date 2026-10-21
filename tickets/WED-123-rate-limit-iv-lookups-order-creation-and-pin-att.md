---
id: WED-123
title: Rate-limit IV lookups, order creation and PIN attempts
epic: security
status: todo
priority: urgent
estimate: M
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-031, WED-036, WED-072]
blocks: [WED-129, WED-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-123: Rate-limit IV lookups, order creation and PIN attempts

## Context

The PRD requires rate limits on IV lookups, order creation and PIN attempts.

See: [Security](../docs/prd.md#security).

## Scope

- Postgres-backed sliding window limiter keyed by IP hash and device.
- Applied to /i, /p, lost-link, orders and PIN entry with friendly 429 pages.

## Out of scope

- WAF rules.

## Acceptance criteria

- [ ] Exceeding each limit returns 429 with a friendly message (unit + e2e).
- [ ] IPs are stored hashed with a rotating salt (test).

## Test plan

- Unit: Limiter.
- End-to-end: Limit hits.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/rate-limit.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
