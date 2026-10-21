---
id: WED-084
title: Queue order alerts in an outbox and batch them per station
epic: alerts
status: todo
priority: high
estimate: M
labels: [backend, db]
module: ordering
owner: ""
agent: ""
blocked_by: [WED-024, WED-074]
blocks: [WED-085, WED-086, WED-112, WED-143]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-084: Queue order alerts in an outbox and batch them per station

## Context

Every new order queues an alert; when busy, alerts batch per station every 60 seconds. The board stays the source of truth.

See: [ORD-9 WhatsApp order alerts](../docs/prd.md#ord-9--whatsapp-order-alerts-must).

## Scope

- ADR: outbox table drained by Supabase pg_cron (Vercel Hobby cron is daily only) or request-time flush.
- Batching rule from assumption 7; dry-run provider for dev/test.
- Message format "Table 12: 2 x chicken, 1 x water. Note: no pepper."

## Out of scope

- Provider (WED-085).

## Acceptance criteria

- [ ] Three orders in 60s produce one batched message per station (unit with fake clock).
- [ ] An alert failure never blocks order creation (test).
- [ ] ADR merged.

## Test plan

- Unit: Batching and formatting.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/server/alerts.ts`
- `docs/decisions/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
