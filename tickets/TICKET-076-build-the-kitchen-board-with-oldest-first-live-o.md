---
id: TICKET-076
title: Build the kitchen board with oldest-first live orders
epic: ordering
status: done
priority: high
estimate: L
labels: [frontend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-019, TICKET-031, TICKET-033, TICKET-074, TICKET-128]
blocks: [TICKET-077, TICKET-078, TICKET-087, TICKET-112]
branch: TICKET-076
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-076: Build the kitchen board with oldest-first live orders

## Context

Kitchen staff see incoming orders by table, oldest first, with a sound alert on new orders, readable at arm's length on a tablet.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-4) · [Users and roles](../docs/prd.md#users-and-roles) · [Design principles (repo)](../docs/design-principles.md).

## Scope

- Board at /kitchen behind a kitchen PIN; order cards with table (≥32px), items, notes, dietary notes, age.
- Sound on new orders after a user gesture unlocks audio.
- Wake lock where supported.

## Out of scope

- Status buttons (TICKET-078).

## Acceptance criteria

- [x] New orders appear oldest-first within 2s (e2e).
- [x] A new order plays a sound when audio is unlocked and shows a visual flash regardless.
- [x] Preserve the unperformed one-metre tablet legibility check as an unchecked, release-blocking TICKET-201 requirement under the owner-approved preview disposition. This records the transfer only; physical legibility is not certified.

## Test plan

- End-to-end: Realtime order arrival.
- Manual: Tablet legibility check.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(staff)/kitchen/`
- `src/modules/ordering/components/board.tsx`

## Notes / decisions

- 2026-11-12 — TICKET-232 records the owner-authorized transfer of the unperformed one-metre tablet check to TICKET-201. Both release blockers remain; no device result is claimed. Product implementation merged in PR #140.

_Agents append dated notes here while working._

- 2026-11-09 (unclechenna, claude):
  - **Live path:** the TICKET-033 kitchen channel. Every notice, rejoin and retry refetches `GET /api/kitchen/board`,
    so a missed message can't leave a gap.
  - **Projection:** the response is checked against a strict kitchen contract. Dietary notes come from guests seated
    at the order's table (their own table, or else their household's). A bar ticket schema with no dietary field is
    ready for the bar board.
  - **Station order statuses** are received, preparing, served and cancelled; there's no "ready". The board shows
    received and preparing.
  - **Sound:** a two-note chime made with Web Audio after "Turn on sound", so no audio file has to load. The flash
    is an opacity fade with a "New" label, and it shows whether sound is on or not.
  - **Open:** legibility at 1 metre on a real tablet is a manual check for the owner.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — unclechenna (claude) — started ahead of TICKET-033 (in_review), TICKET-128 (blocked)
- 2026-11-09 — todo → in_progress — unclechenna (claude) — started ahead of TICKET-033 (in_review), TICKET-128 (blocked)
