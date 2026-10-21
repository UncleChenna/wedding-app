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
pr: https://github.com/UncleChenna/wedding-app/pull/11
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

- [x] A PR shows all CI jobs green, linked in notes.
- [x] CI's verify job runs exactly `pnpm verify` plus setup steps.
- [x] `.env.example` documents every variable in `ci.yml`.

## Test plan

- Manual: Open the PR's Checks tab and link the run.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `.github/workflows/ci.yml`
- `.env.example`

## Notes / decisions

- 2026-10-21: Resolved develop conflicts, preserving merged prerequisite fixes and progress history. Quick and full verification passed: 110 unit tests, production build, 17 browser smoke passes and 7 existing skips.

- 2026-10-21: Resolved develop conflicts, preserving merged prerequisite fixes and progress history. Quick and full verification passed: 108 unit tests, production build, 17 browser smoke passes and 7 existing skips.

- 2026-10-21: All required jobs are green on [PR #8](https://github.com/UncleChenna/wedding-app/pull/8), [CI run 39586928907](https://github.com/UncleChenna/wedding-app/actions/runs/39586928907): tickets valid, no attribution, pnpm verify, migrations + seed. The optional review job is intentionally disabled. CI verify already invokes exactly pnpm verify after setup; no workflow edit was necessary. Added documentation for POSTGRES_PASSWORD, PR_TITLE and PR_BODY as comments in .env.example, plus regression checks. Before fix: 1 test failed / 1 passed. Quick and full local gates pass: 106 unit tests, build, 17 smoke passes, 7 existing skips. This ticket PR will also receive a fresh CI run.

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-004.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — divine (codex)
- 2026-10-21 — todo → in_progress — divine (codex)
- 2026-10-21 — in_progress → in_review — divine (codex)
- 2026-10-21 — in_review → in_progress — divine (codex) — Resolve remaining PR conflicts with develop
- 2026-10-21 — in_review → in_progress — divine (codex) — Resolve new conflicts after PR 9 merged
