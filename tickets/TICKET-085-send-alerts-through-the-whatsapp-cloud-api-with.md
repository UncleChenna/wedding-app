---
id: TICKET-085
title: Send alerts through the WhatsApp Cloud API with retries
epic: alerts
status: todo
priority: high
estimate: M
labels: [backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-083, TICKET-084, TICKET-086]
blocks: [TICKET-087, TICKET-154]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-085: Send alerts through the WhatsApp Cloud API with retries

## Context

Alerts go from one dedicated number to opted-in station leads, with retries and visible failures.

See: [ORD-9 WhatsApp order alerts](../docs/prd.md#ord-9--whatsapp-order-alerts-must).

## Scope

- Provider adapter with timeout, retry/backoff and failure recording.
- Secrets server-only.

## Out of scope

- Inbound replies.

## Acceptance criteria

- [ ] A provider 500 retries up to 3 times then records failure (unit with mocked fetch).
- [ ] A live test message is received on a staff phone (manual, in notes).

- [ ] Require recorded station opt-in before sending; provider timeout/retry must not duplicate a batch and failure leaves the board operational.

## Test plan

- Unit: Adapter with mocked HTTP.
- Manual: Live send.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: opt-out, timeout-after-provider-acceptance, repeated callback and disconnected provider.

## Files likely touched

- `src/modules/ordering/server/whatsapp.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
