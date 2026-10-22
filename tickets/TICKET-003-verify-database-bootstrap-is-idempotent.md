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

- [ ] `pnpm db:migrate` twice in a row succeeds; the second run applies nothing.
- [ ] `pnpm db:seed` twice yields identical row counts.
- [ ] A committed check (`pnpm db:check-rls` or a test) fails if any public table lacks RLS.
- [ ] Evidence (commands and counts) is recorded in the ticket notes.

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

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-22 — todo → claimed — unclechenna (claude)
- 2026-10-22 — todo → in_progress — unclechenna (claude)
