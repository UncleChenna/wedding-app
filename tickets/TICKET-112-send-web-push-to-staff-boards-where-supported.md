---
id: TICKET-112
title: Send web push to staff boards where supported
epic: pwa
status: done
priority: low
estimate: L
labels: [pwa, backend]
module: ordering
owner: divine
agent: codex
blocked_by: [TICKET-076, TICKET-084, TICKET-105]
blocks: [TICKET-250]
branch: TICKET-112
pr: https://github.com/UncleChenna/wedding-app/pull/184
created: 2026-10-21
updated: 2026-11-13
started: 2026-11-13
completed: 2026-11-13
reason: "Implementation and independent review pass; real push-provider registration/delivery remains unverified after bounded local attempts. PR184 retains the original end-to-end delivery criterion."
resume_to: in_progress
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

- [x] Subscribed Chromium context receives a push for a new order (e2e).
- [x] Denied permission leaves the board working (unit).

## Test plan

- End-to-end: Push in Chromium.
- Manual: Installed iOS PWA push check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/sw.ts`
- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-13 (unclechenna, claude): Merged in #184. The headed-browser e2e and the denied-permission unit test pass; delivery through a real push service to a real device is TICKET-250.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → blocked — divine (codex) — Implementation and independent review pass; real push-provider registration/delivery remains unverified after bounded local attempts. PR184 retains the original end-to-end delivery criterion.
- 2026-11-13 — in_review → done — unclechenna (claude) — PR #184 merged
