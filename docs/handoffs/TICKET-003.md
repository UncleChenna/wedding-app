# TICKET-003 handoff

## 2026-10-22 — TICKET-003 — Database bootstrap verified

- **Who / agent / branch:** unclechenna · claude · `TICKET-003`, base `develop` 15533a1.
- **Changed:**
  - `pnpm db:check-rls` fails, naming the tables, when any public table lacks RLS; an empty schema is an error.
  - `pnpm db:counts` prints sorted per-table row counts plus applied migrations, so repeated runs can be diffed.
  - Documented in AGENTS.md, the db-migration skill and docs/current-state.md. No migration or seed changes were needed.
- **Checks:**
  - Second `db:migrate` changed nothing (1 migration before and after).
  - Two `db:seed` runs gave identical counts (245 guests, 110 invitations, 28 tables, 16 menu items, etc.).
  - `db:check-rls` passed on 10 tables and failed (exit 1) with a throwaway unprotected table.
  - Unit tests for the pure logic. `pnpm verify` passed: 136 unit tests, build, 27 browser tests.
- **Learned:** The current pre-tool shell guard rejects `>/dev/null` and variable redirect targets; use explicit in-checkout paths.
- **Next / blockers:** Human review of the PR into develop. Suggested follow-up (CI change, needs approval): run `pnpm db:check-rls` in the CI `database` job.
