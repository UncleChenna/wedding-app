---
id: WED-123
title: Apply ordering abuse limits and regress shared endpoint protection
epic: security
status: todo
priority: high
estimate: M
labels: [security, backend]
module: shared
owner: ""
agent: ""
blocked_by: [WED-185, WED-072, WED-048]
blocks: [WED-129]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-123: Apply ordering abuse limits and regress shared endpoint protection

## Context

The PRD requires rate limits on IV lookups, order creation and PIN attempts.

See: [Security](../docs/prd.md#security).

## Scope

- Extend WED-185 shared limiter to unauthenticated ordering, lost-link requests and cross-endpoint regression. Invitation/PIN launch protection ships in WED-185.

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
