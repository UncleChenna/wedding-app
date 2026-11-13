---
id: TICKET-230
title: Record authorized ticket ownership handoffs
epic: foundations
status: done
priority: high
estimate: S
labels: [infra]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-230
pr: https://github.com/UncleChenna/wedding-app/pull/170
created: 2026-11-12
updated: 2026-11-12
started: 2026-11-12
completed: ""
reason: ""
resume_to: ""
---

# TICKET-230: Record authorized ticket ownership handoffs

## Context

The owner authorized completing and merging the remaining backlog, including work previously performed by another agent. Existing CLI ownership guards correctly reject impersonation but provide no explicit handoff operation. See [collaboration](../docs/collaboration.md).

## Scope

- Add an explicit audited ownership handoff command, preserving status, branch, PR and verification requirements.
- Require the expected previous owner and an authorization/coordination reason; compare ownership again inside the shared-ledger transaction.

## Out of scope

- Automatic takeover, bypassing verification, changing product behavior, or modifying another editor's working files.

## Acceptance criteria

- [x] A coordinated handoff records the actual actor, old/new owner and reason without changing status, branch, PR or evidence.
- [x] Missing authorization acknowledgement, stale expected ownership, unclaimed and terminal tickets are rejected without mutation.
- [x] Existing claim, release, move and reconciliation ownership protections remain unchanged.
- [x] Documentation requires checking for another active editor and preserving uncommitted work before handoff.

## Test plan

- Unit: handoff guards and preserved metadata.
- Integration: real shared Git ledger transition and stale-owner rejection.
- Verification: focused ticket tests and quick checks; independent review and selected CI.

## Files likely touched

- `scripts/tickets.ts`, `scripts/tickets/workflow.ts`, ticket tests and collaboration docs.

## Notes / decisions

- 2026-11-12: Standing user authorization permits coordinated handoffs; this records that authorization, rather than pretending to be the previous collaborator.

## Activity log

- 2026-11-12 — new → backlog — divine
- 2026-11-12 — backlog → todo — divine (codex)
- 2026-11-12 — todo → claimed — divine (codex)
- 2026-11-12 — todo → in_progress — divine (codex)
- 2026-11-12 — in_progress → in_review — divine (codex)
