---
id: TICKET-202
title: Record unused ticket allocation
epic: foundations
status: backlog
priority: medium
estimate: S
labels: [infra, docs]
module: harness
owner: ""
agent: ""
blocked_by: []
blocks: []
branch: ""
pr: ""
created: 2026-10-26
updated: 2026-10-26
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-202: Record unused ticket allocation

## Context

An invalid `t:new` invocation allocated ID 202 before failing on missing ownership input. No implementation task was created. Retain this reserved ID so ticket IDs stay contiguous; the allocator defect is tracked in TICKET-194.

See [ticket lifecycle](../docs/tickets.md).

## Scope

- Preserve the allocation record and cancel it through the CLI.

## Out of scope

- Allocator changes (TICKET-194) and stacked PR validation (TICKET-203).

## Acceptance criteria

- [ ] Shared ledger records this unused allocation as cancelled.

## Test plan

- Manual: `pnpm t:show TICKET-202` reports cancellation; `pnpm t:validate` accepts the restored sequence.

## Files likely touched

- This allocation record only.

## Notes / decisions

- 2026-10-26: Recovered from the template, without allocating another ID. File metadata is an initial definition; the shared ledger holds the CLI cancellation.

## Activity log

- 2026-10-26 — allocation recovered → backlog — divine
