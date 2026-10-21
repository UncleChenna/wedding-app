---
id: TICKET-112
title: Send web push to staff boards where supported
epic: pwa
status: todo
priority: low
estimate: L
labels: [pwa, backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-076, TICKET-084, TICKET-105]
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

# TICKET-112: Send web push to staff boards where supported

## Context

Boards that are backgrounded (or installed iOS PWAs) can still be notified of new orders.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-4).

## Scope

- VAPID keys server-side; subscribe from the board; push on new orders via the outbox.
- Graceful when unsupported or denied.

## Out of scope

- Guest push.

## Acceptance criteria

- [ ] Subscribed Chromium context receives a push for a new order (e2e).
- [ ] Denied permission leaves the board working (unit).

## Test plan

- End-to-end: Push in Chromium.
- Manual: Installed iOS PWA push check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/sw.ts`
- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
