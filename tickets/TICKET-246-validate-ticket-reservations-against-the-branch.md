---
id: TICKET-246
title: Validate ticket reservations against the branch baseline
epic: foundations
status: in_progress
priority: urgent
estimate: S
labels: [test, infra]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-246
pr: https://github.com/UncleChenna/wedding-app/pull/205
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-246: Validate ticket reservations against the branch baseline

## Context

Ticket validation compares reserved IDs with the moving origin/develop tip. When another ticket merges, an otherwise valid older branch can fail validation because it lacks that newly merged definition. Keep deletion detection relative to the branch’s actual common baseline. See docs/tickets.md and the PRD engineering workflow.

## Scope

- Resolve the branch/develop merge-base and use its committed ticket IDs for reservation exemptions.
- Fail closed if the ledger, merge-base or baseline tree cannot be read.
- Prove that advancing develop does not invalidate an older intact branch, while deleting a baseline definition still fails.

## Out of scope

- Renumbering tickets, skipping validation, relaxing duplicate/dependency checks, or changing ownership/status authorization.

## Acceptance criteria

- [x] An older valid branch still validates after another reserved ticket merges into develop.
- [x] Removing a ticket present in that branch’s merge-base fails validation.
- [x] Missing ledger or baseline data retains strict missing-ID validation.
- [x] Focused real-Git regressions and normal hooks pass.

## Test plan

- Unit: Red/green isolated Git tests advancing a remote-tracking develop reference.
- Baseline deletion, missing-ref/ledger and existing ticket validator regressions.

## Files likely touched

- scripts/tickets.ts
- scripts/__tests__/tickets.test.ts or a focused CLI regression file.

## Notes / decisions

- 2026-11-13 — Explicitly delegated as a separate harness repair; the coordinator took implementation while the push migration is tested independently.

- 2026-11-13: Four focused real-Git regressions pass after reproducing the moving-tip and missing-baseline failures. Normal hook completion is recorded in the PR evidence.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
- 2026-11-13 — in_review → in_progress — divine (codex) — Repair hosted depth-one checkout failure; preserve strict baseline validation
