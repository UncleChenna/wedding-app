---
name: db-migration
description: Use when changing the Drizzle schema, adding a migration, or updating database seed data; never for production resets.
---

# Db Migration

1. Read `docs/architecture.md`, ADR 0003, ADR 0010, and the current schema. Work in a managed, isolated worktree.
2. Write failing tests for data constraints or behaviour, then change the Drizzle schema. RLS changes need explicit user authorization and an ADR.
3. Run `pnpm db:generate` and commit its output; new generated files need no approval file (TICKET-217). Never hand-edit a migration already on `develop`. New custom migrations must be generated through Drizzle. If the SQL drops, retypes or renames a table or column, or deletes rows, the commit hook refuses it: ask the owner, and with their yes record it in `.harness/approved-writes.json` and the PR.
4. Update deterministic seed data and its tests. Run `pnpm db:migrate` twice and verify the second run makes no changes: save `pnpm db:counts` after each run and diff them (the applied-migration count and every row count must match). Run `pnpm db:check-rls`; every public table must have RLS.
5. With authorization for disposable local data, run `pnpm db:reset`, then seed again and compare counts. Never reset a production or another worktree database.
6. Run `pnpm verify`, inspect generated SQL, and record migration/seed evidence and rollback considerations in the PR.
