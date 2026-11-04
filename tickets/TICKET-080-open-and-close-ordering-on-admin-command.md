---
id: TICKET-080
title: Open and close ordering on admin command
epic: ordering
status: in_progress
priority: high
estimate: S
labels: [backend, frontend]
module: ordering
owner: unclechenna
agent: claude
blocked_by: [TICKET-025, TICKET-072, TICKET-088]
blocks: [TICKET-133, TICKET-154, TICKET-166]
branch: TICKET-080
pr: ""
created: 2026-10-21
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-080: Open and close ordering on admin command

## Context

Ordering opens only after the couple's entrance and closes at the end.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-7).

## Scope

- ordering_open setting enforced server-side.
- Closed page with a warm message; staff-entered orders still allowed.

## Out of scope

- Scheduling.

## Acceptance criteria

- [x] With ordering closed, guest submits are rejected server-side (unit) and the page says so (e2e).
- [x] Toggling takes effect within 5s.

## Test plan

- Unit: Gate check.
- End-to-end: Closed state.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/ordering/`
- `src/modules/admin/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-04:
  - **Server.** `createOrder` reads `event_settings.ordering_open` straight after the replay check and refuses guest
    orders with `closed` while it's off. A retry of an order made before closing still returns that order.
    `createOrder(db, order, { staffEntered: true })` bypasses the switch for staff-entered orders (TICKET-079).
  - **Default is closed.** The column already defaulted to `false`, so after this merges guests can't order until an
    admin opens ordering. Opt-in ordering tests now open it in setup and restore it afterwards
    (`e2e/support/ordering-open.ts`).
  - **Live.** `GET /api/menu/availability` now returns `open`. The 3-second poll switches the guest page between the
    menu and "The menu opens soon" (kept choices, polite announcement) with no reload. A `closed` refusal at submit
    switches it at once.
  - **Admin.** "Table ordering" on the control room page states the current state in words and toggles it
    (`setOrderingOpenAction`, checking admin access itself).
  - **Evidence.**
    - Database: guest refused while closed with nothing written; staff accepted; pre-close retry replayed (21
      passed).
    - Browser: the closed page plus the API refusing (422 `closed`); open and close each reach an open page in under
      5s; axe and overflow in every theme. Signed-in admin switch closes and reopens (`e2e/admin-menu.spec.ts`).
    - Component tests: closed view, live switching and announcements.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — unclechenna (claude)
- 2026-11-04 — todo → in_progress — unclechenna (claude)
