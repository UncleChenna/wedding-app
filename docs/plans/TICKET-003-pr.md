# Ticket

Ticket: TICKET-003

# Summary

The local database bootstrap (Supabase stack, Drizzle migrations, deterministic seed) had never been proven repeatable, and nothing checked that every public table keeps row-level security. Every later database ticket (starting with the TICKET-023 schema redesign) depends on both.

This PR adds two database checks and records evidence that migrate and seed are idempotent on a fresh stack. No migration or seed logic needed fixing.

# Changes

- **`scripts/db-check-lib.ts`** (new, pure):
  - `tablesMissingRls()` returns the sorted names of public tables without RLS, and throws on an empty table list, so a wrong or unmigrated database can't pass as "all protected".
  - `formatCounts()` prints one sorted `table count` line per table plus the applied-migration count, so two runs diff cleanly.
- **`scripts/db-check.ts`** (new CLI, reads `.env.local` like `seed.ts`):
  - `rls` queries `pg_class.relrowsecurity` for ordinary and partitioned tables in `public`, and exits 1 with the offending table names.
  - `counts` prints row counts for every `public` table and the `drizzle.__drizzle_migrations` count.
- **`package.json`**: `pnpm db:check-rls` and `pnpm db:counts`.
- **`scripts/__tests__/db-check.test.ts`**: 4 unit tests (all protected, unprotected tables named and sorted, empty schema rejected, stable count format).
- **Docs:**
  - AGENTS.md command table.
  - The `db-migration` skill now says how to prove the second migrate changes nothing (diff `db:counts`) and to run `db:check-rls`.
  - `docs/current-state.md` records the verified bootstrap.
  - Plan in `docs/plans/2026-10-22-TICKET-003.md`; handoff in `docs/handoffs/TICKET-003.md`.

# Acceptance criteria and evidence

All runs were on this ticket's isolated worktree stack (fresh from `pnpm wt:new TICKET-003`), base `develop` 15533a1.

- [x] **`pnpm db:migrate` twice succeeds; the second run applies nothing.** `db:counts` before and after the second migrate is identical, including `(drizzle migrations applied) 1`. Second migrate exited 0.
- [x] **`pnpm db:seed` twice yields identical row counts.** Diff of `db:counts` after each seed is empty:
      `check_ins 30, guests 245, invitations 110, menu_items 16, order_items 39, orders 18, rsvps 110, staff 4, tables 28, themes 2`.
      The seed truncates and reinserts deterministic data in one transaction.
- [x] **A committed check fails if any public table lacks RLS.**
  - `pnpm db:check-rls` → `✔ Row-level security enabled on all 10 public tables.`
  - Negative proof: after creating a throwaway `public.tmp_no_rls_probe` table it printed `✖ Row-level security is disabled on: tmp_no_rls_probe` and exited 1. The table was dropped and the check passed again.
  - Unit tests cover the decision logic.
- [x] **Evidence recorded in the ticket notes.** See `tickets/TICKET-003-verify-database-bootstrap-is-idempotent.md`.

# Verification

- `pnpm exec vitest run scripts/__tests__/db-check.test.ts`: failed first (module missing), then 4 passed.
- `pnpm verify`: passed. 190 tickets valid, format, lint, typecheck, 136 unit tests (18 files), production build, 27 browser tests.
- `pnpm agents:check`: passed after the skill edit.
- **Not verified:** the checks against the hosted Supabase project (it does not exist yet; TICKET-144), and CI running `db:check-rls` (not wired in; see below).

# Risks and rollout

- **Scope:** read-only checks plus docs. No schema, migration, seed or app change, so no rollout or rollback steps.
- `db:check-rls` uses whatever `DATABASE_URL` is loaded. It only reads catalog tables, but point it at the intended database.
- **Follow-up for the reviewer (CI change, needs approval):** add `- run: pnpm db:check-rls` to the CI `database` job after the migrate step, so a migration that creates a table without RLS fails the PR. Left out because repo rules require asking before CI changes.

# Screenshots

N/A: no UI change (database scripts and docs only).

# UI checklist

N/A for every UI item: no routes, components, styles or themes changed.

- [ ] **Screenshots:** N/A, no UI change.
- [ ] **Tokens:** N/A.
- [ ] **Restraint and typography:** N/A.
- [ ] **Mobile:** N/A.
- [ ] **Motion:** N/A.
- [ ] **Keyboard:** N/A.
- [ ] **Contrast:** N/A.
- [ ] **Load and images:** N/A.
- [ ] **Performance:** N/A.
- [ ] **Copy:** N/A.
- [ ] **Shared components:** N/A.
- [ ] **Sharing and devices:** N/A.
- [ ] **QR codes:** N/A.
- [ ] **Staff feedback:** N/A.
- [x] **Verification:** `pnpm verify` passed (see Verification).

# Harness changes, if any

- The `db-migration` skill gains the `db:counts` diff and `db:check-rls` steps. No hook changes.
