---
id: TICKET-070
title: Start the order page by typing and validating a table number
epic: ordering
status: todo
priority: high
estimate: M
labels: [frontend, backend]
module: ordering
owner: ""
agent: ""
blocked_by: [TICKET-018, TICKET-171]
blocks: [TICKET-071]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-070: Start the order page by typing and validating a table number

## Context

One generic QR on every table card opens /order; the guest types their table number, checked against the list of tables. No sign-in.

See: [Table ordering](../docs/prd.md#table-ordering) (ORD-1, ORD-8) · [Journey 3: ordering from the table](../docs/prd.md#journey-3-ordering-from-the-table).

## Scope

- /order with a large numeric table input and PRD copy "Hungry? Thirsty? Say the word."
- Server validation against tables; remembered for the session.
- Change-table link.

## Out of scope

- Menu (TICKET-071).

## Acceptance criteria

- [ ] Unknown table numbers show a friendly error; known ones proceed (e2e).
- [ ] The table number persists across reloads in the same browser.
- [ ] No sign-in or IV token is required.

## Test plan

- Unit: Table validation.
- End-to-end: Valid and invalid table entry.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/app/(guest)/order/`
- `src/modules/ordering/`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
