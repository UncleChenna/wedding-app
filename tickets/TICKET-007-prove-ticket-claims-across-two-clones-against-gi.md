---
id: TICKET-007
title: Prove ticket claims across two clones against GitHub
epic: foundations
status: todo
priority: medium
estimate: S
labels: [test, infra]
module: harness
owner: ""
agent: ""
blocked_by: [TICKET-004]
blocks: []
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-007: Prove ticket claims across two clones against GitHub

## Context

The ticket ledger's compare-and-swap is unit-tested against a local bare remote; it must also hold against GitHub with two developers.

See: [Working together](../docs/collaboration.md).

## Scope

- Two clones with different `harness.owner` race `t:claim` on the same ticket against `origin`.
- Check `t:next` and `t:board` show the live claim from the other clone.

## Out of scope

- Changing the ledger design.

## Acceptance criteria

- [ ] Exactly one claim succeeds; the other prints `already claimed`.
- [ ] The loser's `pnpm t:next` skips the claimed ticket.
- [ ] The ledger commit is visible on `origin/ticket-ledger`.

## Test plan

- Manual: Run from two clones; paste outputs.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/tickets.ts`
- `docs/tickets.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
