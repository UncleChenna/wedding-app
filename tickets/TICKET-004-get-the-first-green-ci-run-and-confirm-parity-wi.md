---
id: TICKET-004
title: Get the first green CI run and confirm parity with pnpm verify
epic: foundations
status: in_progress
priority: urgent
estimate: S
labels: [infra, test]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: [TICKET-005, TICKET-007, TICKET-147]
branch: TICKET-004
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# TICKET-004: Get the first green CI run and confirm parity with pnpm verify

## Context

Migrated from SETUP-004. The workflow has never run on GitHub because `origin` was empty until this backlog was pushed.

See: [Current state](../docs/current-state.md) · [Testing plan](../docs/prd.md#testing-plan).

## Scope

- Make the CI jobs (`tickets`, `pr-text`, `verify`, `database`) pass on GitHub.
- Every env var CI sets is documented in `.env.example`.
- Fix drift between CI and `pnpm verify`.

## Out of scope

- Branch protection (TICKET-005).

## Acceptance criteria

- [ ] A PR shows all CI jobs green, linked in notes.
- [ ] CI's verify job runs exactly `pnpm verify` plus setup steps.
- [ ] `.env.example` documents every variable in `ci.yml`.

## Test plan

- Manual: Open the PR's Checks tab and link the run.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `.github/workflows/ci.yml`
- `.env.example`

## Notes / decisions

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-004.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
