---
id: TICKET-007
title: Prove ticket claims across two clones against GitHub
epic: foundations
status: in_progress
priority: medium
estimate: S
labels: [test, infra]
module: harness
owner: divine
agent: codex
blocked_by: [TICKET-004]
blocks: []
branch: TICKET-007
pr: ""
created: 2026-10-21
updated: 2026-10-26
started: 2026-10-26
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

- [x] Exactly one claim succeeds; the other prints `already claimed`.
- [x] The loser's `pnpm t:next` skips the claimed ticket.
- [x] The ledger commit is visible on `origin/ticket-ledger`.

## Test plan

- Manual: Run from two clones; paste outputs.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/tickets.ts`
- `docs/tickets.md`

## Notes / decisions

- 2026-10-26: Real GitHub two-clone race passed: exactly one winner, loser rejected as already claimed and observes winner in board/show; next skips probe. Remote ledger commit recorded. Temporary TICKET-005 claim released and confirmed unowned. See docs/reviews/TICKET-007/README.md.

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-26 — todo → claimed — divine (codex)
- 2026-10-26 — todo → in_progress — divine (codex)
