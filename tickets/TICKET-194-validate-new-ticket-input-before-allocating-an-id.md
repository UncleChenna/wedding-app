---
id: TICKET-194
title: Validate new-ticket input before allocating an id
epic: foundations
status: backlog
priority: medium
estimate: S
labels: [infra, test]
module: harness
owner: ""
agent: ""
blocked_by: []
blocks: []
branch: ""
pr: ""
created: 2026-10-25
updated: 2026-10-25
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-194: Validate new-ticket input before allocating an id

## Context

`pnpm t:new` allocates the next id in the shared ledger before it checks its own arguments. When the input is invalid (for example `--estimate XS`), the command fails but the id is already used, and `t:validate` then fails for everyone with "ids must be contiguous; missing TICKET-NNN". This happened on 2026-10-25: TICKET-194 was burned by a rejected `--estimate XS`, and this ticket was written by hand to fill the gap.

See: [Tickets](../docs/tickets.md).

## Scope

- In `scripts/tickets.ts` `newTicket`, build and parse the ticket with a placeholder id before calling `mutateLedger`; allocate only once the input is valid.
- List the valid enum values (estimate, priority, status) in the error message.

## Out of scope

- Reclaiming ids that were already burned (cancel them instead).

## Acceptance criteria

- [ ] `t:new` with an invalid `--estimate` fails without changing the ledger's `lastId` (script test).
- [ ] The error lists the valid values.

## Test plan

- Unit: `scripts/__tests__` test with a temporary ledger: invalid input leaves `lastId` unchanged; valid input allocates the next id.
- Gate: `pnpm verify` passes.

## Files likely touched

- `scripts/tickets.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-25 — new → backlog — unclechenna
