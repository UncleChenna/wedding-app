---
id: TICKET-085
title: Send alerts through the WhatsApp Cloud API with retries
epic: alerts
status: todo
priority: high
estimate: L
labels: [backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-084, TICKET-086, TICKET-076]
blocks: [TICKET-154]
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
- Merged from TICKET-087 (Show alert delivery health on the boards):
  - Small indicator: last alert sent / failing.

## Out of scope

- Inbound replies.

## Acceptance criteria

- [ ] A provider 500 retries up to 3 times then records failure (unit with mocked fetch).
- [ ] A live test message is received on a staff phone (manual, in notes).

- [ ] Require recorded station opt-in before sending; provider timeout/retry must not duplicate a batch and failure leaves the board operational.
- [ ] (from TICKET-087) A recorded failure shows a visible warning with text on the board (e2e).

## Test plan

- Unit: Adapter with mocked HTTP.
- Manual: Live send.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: opt-out, timeout-after-provider-acceptance, repeated callback and disconnected provider.
- (TICKET-087) End-to-end: Failure indicator.

## Files likely touched

- `src/modules/ordering/server/whatsapp.ts`

## Notes / decisions

_Agents append dated notes here while working._
- 2026-11-12 (unclechenna, claude): TICKET-228 merged TICKET-087 into this ticket (all unstarted) to cut per-ticket overhead. Their scope, criteria and dependencies are above; the merged tickets are cancelled.
- 2026-11-13 (unclechenna, claude): owner approved building this before the WhatsApp number exists. TICKET-083 no
  longer blocks the build: the sender stays off until its settings are set and is tested against a mocked Cloud
  API. The manual live-message criterion still needs TICKET-083 before this ticket is done.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
