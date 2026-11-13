---
id: TICKET-232
title: Reconcile merged ordering tickets and retain tablet release QA
epic: quality
status: in_progress
priority: high
estimate: S
labels: [docs]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-232
pr: ""
created: 2026-11-12
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-232: Reconcile merged ordering tickets and retain tablet release QA

## Context

Merged ordering work remains open because one physical-tablet criterion has no recorded outcome and historical failed CI needs explicit repair evidence. Preserve the [table ordering](../docs/prd.md#table-ordering) requirements while reconciling completed work honestly.

## Scope

- Move TICKET-076's unperformed one-metre tablet check into the existing release-blocking TICKET-201 under the owner's standing manual-QA disposition.
- Document verified PR/head/CI evidence and closure order for TICKET-076, TICKET-077, TICKET-078, TICKET-075 and TICKET-133.
- Use explicit coordinated ownership handoff and CLI completion/reconciliation after definition changes merge; preserve collaborator worktrees.

## Out of scope

- Claiming physical QA passed, changing product code, weakening checks, or editing active TICKET-079/TICKET-135 work.

## Acceptance criteria

- [x] The manual tablet requirement remains unchecked in TICKET-201, which continues to block both releases; TICKET-076 explicitly records the approved transfer rather than a physical pass.
- [x] The merged ordering chain has documented exact PR/CI evidence and dependency order, distinguishing original success from verified repairs.
- [x] Ticket definitions validate and changed Markdown formatting passes.

## Test plan

- Run ticket validation and targeted formatting checks.
- Read GitHub merged PR heads and successful CI, validate ancestry through the existing CLI, and make lifecycle changes only after the definition repair merges.
- No product or physical-device tests are claimed by this documentation ticket.

## Files likely touched

- `tickets/TICKET-076-*`, `tickets/TICKET-201-*`, this ticket and its PR write-up.

## Notes / decisions

- 2026-11-12: Owner authorizes verified merges and retaining physical QA as explicit release requirements. Existing collaborator worktrees are not modified.

## Activity log

- 2026-11-12 — new → todo — divine (codex)
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
