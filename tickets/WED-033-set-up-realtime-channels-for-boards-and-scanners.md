---
id: WED-033
title: Set up realtime channels for boards and scanners
epic: data-auth
status: todo
priority: high
estimate: M
labels: [backend, security]
module: shared
owner: ""
agent: ""
blocked_by: [WED-027, WED-031]
blocks: [WED-067, WED-068, WED-075, WED-076, WED-097, WED-124]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-033: Set up realtime channels for boards and scanners

## Context

Orders must reach boards within 2 seconds and check-ins must appear on every scanner; Supabase Realtime provides this without our own websockets.

See: [Tech stack and architecture](../docs/prd.md#tech-stack-and-architecture) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-7) · [Table ordering](../docs/prd.md#table-ordering) (ORD-4).

## Scope

- Server-issued short-lived realtime tokens for staff sessions.
- Channel helpers for orders-by-station and check-ins.
- Reconnect and missed-event catch-up via a REST refetch.

## Out of scope

- Board UIs.

## Acceptance criteria

- [ ] A write appears on a subscribed client within 2s locally (e2e timing assertion).
- [ ] Guests cannot subscribe to staff channels (tested).
- [ ] After a dropped connection the client refetches and shows no gaps.

## Test plan

- Unit: Token issuance.
- End-to-end: Two browser contexts receive the same event.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/realtime.ts`
- `src/modules/shared/lib/realtime-client.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
