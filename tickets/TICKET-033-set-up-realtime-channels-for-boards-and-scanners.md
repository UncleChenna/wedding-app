---
id: TICKET-033
title: Set up realtime channels for boards and scanners
epic: data-auth
status: in_progress
priority: high
estimate: M
labels: [backend, security]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-027, TICKET-031]
blocks: [TICKET-067, TICKET-068, TICKET-075, TICKET-076, TICKET-097, TICKET-124]
branch: TICKET-033
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-033: Set up realtime channels for boards and scanners

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

- [x] A write appears on a subscribed client within 2s locally (e2e timing assertion).
- [x] Guests cannot subscribe to staff channels (tested).
- [x] After a dropped connection the client refetches and shows no gaps.
- [x] Gate, bar and anonymous subscribers never receive dietary notes or other households (ADR 0024, from TICKET-027).

## Test plan

- Unit: Token issuance.
- End-to-end: Two browser contexts receive the same event.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/server/realtime.ts`
- `src/modules/shared/lib/realtime-client.ts`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-09 (unclechenna, claude):
  - **Notifications, not data.** Messages carry ids and statuses only (`order.changed`: station order id, order id,
    status; `checkin.recorded`: invitation id, admitted, conflict). Strict schemas refuse any other field when
    publishing and receiving, so names and dietary notes can't travel on a channel. Boards refetch details from
    their own REST endpoint, which applies the station projection (TICKET-128).
  - **Published in the write's transaction** with `realtime.send`, so a rolled-back order publishes nothing. Plain
    Postgres (CI) has no Realtime, and publishing is a no-op there.
  - **Tokens:** 10-minute HS256 tokens signed with the new optional `SUPABASE_JWT_SECRET`. Each refresh rechecks
    the live staff session, so a revoked device stops receiving within 10 minutes. Without the secret, the token
    route answers 503 and screens keep refetching on a timer.
  - **Station client:** `createStationClient` uses supabase-js's `accessToken` option. Without it, a plain client's
    Auth module reset the Realtime token to the publishable key, and joins failed under vitest.
  - **"End-to-end":** the timing and two-subscriber tests run two real Realtime clients (Node WebSocket) through
    the same helper the browser uses, against the local stack. There's no board UI yet (out of scope), so there's
    no browser-context test; the board tickets (TICKET-075, TICKET-076) add one.
  - **Check-in events:** `checkin.recorded` is defined and allowed, but nothing publishes it yet. The gate write
    paths (TICKET-061, TICKET-173) call `publishToStation` when they land.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — unclechenna (claude) — started ahead of TICKET-027 (in_review)
- 2026-11-09 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-027 (in_review)
