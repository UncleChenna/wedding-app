---
id: TICKET-003
title: Verify database bootstrap is idempotent
epic: foundations
status: in_progress
priority: urgent
estimate: M
labels: [db, test]
module: shared
owner: unclechenna
agent: claude
blocked_by: [TICKET-001, TICKET-002]
blocks: [TICKET-006, TICKET-023]
branch: TICKET-003
pr: ""
created: 2026-10-21
updated: 2026-10-22
started: 2026-10-22
completed: ""
reason: ""
resume_to: ""
---

# TICKET-003: Verify database bootstrap is idempotent

## Context

Migrated from SETUP-003. The local Supabase stack, migrations and seed have never been proven repeatable, and every later database ticket relies on them.

See: [Data model](../docs/prd.md#data-model) · [Current state](../docs/current-state.md).

## Scope

- Run migrate twice and seed twice on a fresh local stack.
- Add a script or SQL check that every public table has RLS enabled.
- Fix anything non-idempotent.

## Out of scope

- Schema redesign (TICKET-023/TICKET-024).

## Acceptance criteria

- [x] `pnpm db:migrate` twice in a row succeeds; the second run applies nothing.
- [x] `pnpm db:seed` twice yields identical row counts.
- [x] A committed check (`pnpm db:check-rls` or a test) fails if any public table lacks RLS.
- [x] Evidence (commands and counts) is recorded in the ticket notes.

## Test plan

- Unit: RLS check unit-tested against a fixture list of tables.
- Manual: Fresh `pnpm db:start`, then the commands above, output pasted in notes.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/db-local.mjs`
- `scripts/seed.ts`
- `package.json`

## Notes / decisions

- 2026-10-21: Migrated from `docs/tasks.json` SETUP-003.
- 2026-10-22: Base `develop` 15533a1, fresh stack from `pnpm wt:new TICKET-003` (which applied migrations once). Commands: `pnpm db:counts` → `pnpm db:migrate` → `pnpm db:counts` → diff: identical (`(drizzle migrations applied) 1` before and after; second migrate exit 0).
- 2026-10-22: `pnpm db:seed` twice with `pnpm db:counts` after each → diff identical: check_ins 30, guests 245, invitations 110, menu_items 16, order_items 39, orders 18, rsvps 110, staff 4, tables 28, themes 2. Seed truncates and reinserts deterministic data in one transaction, so no fix was needed.
- 2026-10-22: `pnpm db:check-rls` → `✔ Row-level security enabled on all 10 public tables.` Negative proof: with a throwaway `public.tmp_no_rls_probe` table it printed `✖ Row-level security is disabled on: tmp_no_rls_probe` and exited 1; the table was dropped and the check passed again. An empty schema is also an error (unit-tested).
- 2026-10-22: Decision: CI is unchanged (repo rule: ask before CI changes). Recommended follow-up for the reviewer: add `pnpm db:check-rls` to the CI `database` job after migrations.
- 2026-10-22: `pnpm verify` passed: 190 tickets valid, 136 unit tests (18 files), production build, 27 browser tests.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-22 — todo → claimed — unclechenna (claude)
- 2026-10-22 — todo → in_progress — unclechenna (claude)
