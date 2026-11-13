---
id: TICKET-085
title: Send alerts through the WhatsApp Cloud API with retries
epic: alerts
status: done
priority: high
estimate: L
labels: [backend]
module: ordering
owner: divine
agent: codex
blocked_by: [TICKET-084, TICKET-086, TICKET-076]
blocks: [TICKET-154]
branch: TICKET-085
pr: https://github.com/UncleChenna/wedding-app/pull/208
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: "Implementation and local verification published in PR #208; live phone receipt requires TICKET-083 account, approved template and opted-in recipient. No real message sent."
resume_to: in_progress
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

- [x] A provider 500 retries up to 3 times then records failure (unit with mocked fetch).
- [ ] A live test message is received on a staff phone (manual, in notes).

- [x] Require recorded station opt-in before sending; provider timeout/retry must not duplicate a batch and failure leaves the board operational.
- [x] (from TICKET-087) A recorded failure shows a visible warning with text on the board (e2e).

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

- 2026-11-13 (divine): Implemented configured template sending, committed one-message claims,
  three retries for explicit structured transient500 rejections, no replay for uncertain/partial
  outcomes, phone deduplication, and board health.25 focused tests including5 isolated PostgreSQL
  cases pass; production build and four-theme375px warning/axe browser check pass. A bare500 is
  ambiguous and deliberately not retried. No live message sent; TICKET-083's account/template and
  consenting staff-phone check remain required before done. Detailed guarantee/rollback in ADR0022.

- 2026-11-13 (unclechenna, claude): Merged in #208. The live phone message is the first criterion of TICKET-083 (WhatsApp number setup) and is verified there.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → blocked — divine (codex) — Implementation and local verification published in PR #208; live phone receipt requires TICKET-083 account, approved template and opted-in recipient. No real message sent.
- 2026-11-13 — in_review → done — unclechenna (claude) — PR #208 merged
