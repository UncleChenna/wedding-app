---
id: TICKET-194
title: Validate new-ticket input before allocating an id
epic: foundations
status: in_review
priority: medium
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-194
pr: https://github.com/UncleChenna/wedding-app/pull/38
created: 2026-10-25
updated: 2026-10-26
started: 2026-10-26
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

- [x] `t:new` with an invalid `--estimate` fails without changing the ledger's `lastId` (script test).
- [x] The error lists the valid values.

## Test plan

- Unit: `scripts/__tests__` test with a temporary ledger: invalid input leaves `lastId` unchanged; valid input allocates the next id.
- Gate: `pnpm verify` passes.

## Files likely touched

- `scripts/tickets.ts`

## Notes / decisions

- 2026-10-26: Validate provisional metadata, initial status and actor before reserving an ID. Four real-Git regressions failed before the fix; all 28 ticket tests pass afterward, including unchanged ledger head/lastId and exact next valid ID. Integrated quick/full gates pass (270 unit; 157 browser first-attempt passes, six retry passes, 17 skips). Retry evidence and the original worktree-base timeout are disclosed in docs/handoffs/TICKET-194.md.

_Agents append dated notes here while working._

## Activity log

- 2026-10-25 — new → backlog — unclechenna
- 2026-10-26 — backlog → todo — divine — Ready prerequisite-free allocator repair encountered during backlog completion
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
- 2026-10-26 — in_progress → in_review — divine (codex)
