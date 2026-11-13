---
id: TICKET-075
title: Show guests live status for their order
epic: ordering
status: done
priority: high
estimate: M
labels: [frontend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-033, TICKET-074, TICKET-078]
blocks: [TICKET-081, TICKET-117, TICKET-133, TICKET-135]
branch: TICKET-075
pr: https://github.com/UncleChenna/wedding-app/pull/159
created: 2026-10-21
updated: 2026-11-11
started: 2026-11-11
completed: ""
reason: ""
resume_to: ""
---

# TICKET-075: Show guests live status for their order

## Context

The guest's page updates live through Received, Preparing, Served ("Enjoy every bite.").

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-3) · [Journey 3: ordering from the table](../docs/prd.md#journey-3-ordering-from-the-table) · [On the website](../docs/prd.md#on-the-website).

## Scope

- Confirmation screen per station with live status.
- Public read by submission id only (unguessable).

## Out of scope

- Push notifications to guests.

## Acceptance criteria

- [x] A board status change shows on the guest page within 2s (e2e).
- [x] Another submission's id cannot be guessed (≥96-bit id, unit).

- [x] Anonymous status responses disclose only the opaque order receipt and public item/status information, not guest identities, dietary notes or other tables.

## Test plan

- End-to-end: Two-context status update.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Integration: guessed ids and cross-table access fail; station/public projections contain no private fields.

## Files likely touched

- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-11 (unclechenna, claude):
  - **Polling, not Realtime:** guests poll `GET /api/orders/<receipt>/status` (ADR 0024 keeps browser Realtime for
    staff only). It polls every 1.5 s while in progress, backs off after failures or a 429, and stops once every
    station is served or cancelled. It uses the existing `lookup` request budget.
  - **Receipt:** the receipt is the server-generated order id, a v4 UUID with 122 random bits. Malformed and
    unknown receipts get the same 404.
  - **Production-only bug:** the first build re-ran the polling effect on every render, about 60 requests a
    second. The default fetcher wasn't stable in the production bundle, so it's now held in a ref. The e2e now
    asserts fewer than 20 requests and that polling stops once settled.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-11 — todo → claimed — unclechenna (claude) — started ahead of TICKET-078 (in_review)
- 2026-11-11 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-078 (in_review)
- 2026-11-11 — in_progress → in_review — unclechenna (claude)
