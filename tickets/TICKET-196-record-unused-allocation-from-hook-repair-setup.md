---
id: TICKET-196
title: Record unused allocation from hook repair setup
epic: foundations
status: cancelled
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
updated: 2026-10-26
started: ""
completed: ""
reason: "Unused allocation: t:new failed after reserving id; implementation is TICKET-197"
resume_to: ""
---

# TICKET-196: Record unused allocation from hook repair setup

## Context

See docs/tickets.md for allocated-id continuity.

The first t:new attempt for the hook repair reserved 196 then failed because owner identity was missing. The actual work is TICKET-197. This record preserves the allocated id; TICKET-194 tracks the allocator bug.

## Scope

- Preserve the unused allocation in backlog history.

## Out of scope

- No implementation; hook repair belongs to TICKET-197.

## Acceptance criteria

- [x] Unused allocation is recorded with its failure reason.

## Test plan

- pnpm t:validate checks contiguous ids.

## Files likely touched

- This ticket only.

## Notes / decisions

- Cancel through the CLI as an unused duplicate allocation.

## Activity log

- 2026-10-26 — new → backlog — divine — recovering an allocated id after t:new failed
- 2026-10-26 — backlog → cancelled — divine — Unused allocation: t:new failed after reserving id; implementation is TICKET-197

