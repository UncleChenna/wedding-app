# Ticket

Ticket: TICKET-218

# Summary

Starting a ticket was slow and often failed:

- It took four commands: claim, `wt:new`, `t:move in_progress`, install.
- Every worktree started a full Supabase stack, about 10 Docker containers. All three new worktrees on 2026-11-06
  failed to get a database.
- `t:next` hid tickets whose blockers were only waiting on review.

The database failures weren't really Docker load. `wt:new` ran from a main checkout left on an old branch, so it ran old
harness code that didn't copy the auth template (TICKET-208), and the stack refused to start.

After this PR:

- `pnpm t:start <id>` does the whole start in one command.
- Worktrees start their database only when a database command first needs it.
- `t:*`/`wt:*` warn when the checkout running them has outdated tooling.
- `t:next` also lists tickets that can start ahead of in-flight blockers.

**Depends on #108 (TICKET-217).** This branch is built on it because both edit the same harness files, so merge #108
first.

# Changes

- **`scripts/tickets/start.ts`:** `startPlan` covers backlog → todo → claim → worktree → `in_progress`, and resuming
  your own ticket. `startCommands` gives the exact pnpm command per step. The `in_progress` move runs from the new
  worktree, so its fresh scripts do the push.
- **`scripts/tickets.ts`:**
  - the `t:start` command (`--ahead`, `--db`, `--dry-run`)
  - `t:next` lists up to five "Can start ahead" tickets and suggests `t:start`
  - the stale-harness warning on every command except `validate`
- **`scripts/tickets/graph.ts`:** `startableAhead`. A ticket qualifies when every blocker is done or being worked on,
  at least one isn't done, and nobody has claimed it.
- **`scripts/worktree.mjs`:** `--db` is opt-in, and the database start and migrate steps run only with it. Positional
  arguments now ignore flags. The stale-harness warning is added.
- **`scripts/db-ensure.mjs`** (new): in a managed worktree whose stack isn't running it runs `db:start`; anywhere else
  it does nothing, so the primary checkout and CI behave as before. `package.json` prefixes `db:migrate`, `db:seed` and
  `db:reset` with it.
- **`scripts/harness/stale-harness.mjs`** (new): counts commits on the last-fetched `origin/develop` that touch the
  tooling and aren't in `HEAD`. No fetch is made, so it's instant and works offline. `HARNESS_SKIP_STALE_CHECK=1`
  silences it.
- **Docs and skills:** AGENTS.md (commands, steps 1–3), `docs/collaboration.md`, `docs/tickets.md`, the
  `ticket-workflow` skill and `docs/learnings.md`.
- **Tests:** `scripts/__tests__/fast-start.test.ts`.

# Acceptance criteria and evidence

- [x] **`t:start` claims, creates the worktree, installs and moves to `in_progress` in one command.**
  - Unit tests cover every plan path, including the refusals.
  - Dry run: `pnpm t:start TICKET-092 --dry-run` printed `t:claim … → wt:new TICKET-092 → t:move … in_progress --push`.
- [x] **`wt:new` without `--db` creates a worktree without starting Docker; with `--db` it starts the stack.**
  - Live run of `pnpm wt:new demo-task` with this branch's code:
    - printed "Ready" and "Database not started…"
    - Docker container count was 41 before and 41 after
    - the auth template was copied
    - the demo worktree was removed afterwards
  - The `--db` pass-through is unit-tested.
- [x] **`db:migrate` and `db:seed` start a stopped stack before running.**
  - Live run in this worktree with its stack stopped: `pnpm db:migrate` printed "starting it (first use)", "Local
    database ready", then "migrations applied successfully".
  - A second run didn't start it again.
  - `needsStart` is unit-tested.
- [x] **A checkout behind `origin/develop` on tooling gets a warning.** Throwaway-repo test: a docs-only commit gives no
      warning, a harness commit gives "1 commit(s) behind origin/develop".
- [x] **`t:next` shows tickets to start ahead, labelled.**
  - Unit test: blockers in review or in progress qualify; unstarted or claimed ones don't.
  - Live: `pnpm t:next` now lists five, among them TICKET-027, TICKET-089 and TICKET-026. Before, it found no ready
    ticket.
- [x] **The docs describe `t:start`.** See Changes.

# Verification

- `vitest run scripts/__tests__`: 235 passed, 100 opt-in skips.
- `pnpm typecheck` and ESLint on the changed scripts: clean.
- The live runs above. CI's full `pnpm verify` is the gate.

# Risks and rollout

- **First database command is slower:** the first `db:migrate` or `db:seed` in a worktree now takes as long as
  `wt:new` used to. Opt-in DB test suites need `pnpm db:migrate` (or `db:start`) first; the error says so.
- **Existing worktrees:** they keep their running stacks. Ones created by old code may lack the auth template; rerun
  `pnpm wt:new <id>` from an up-to-date checkout, which resumes setup and copies it.
- **The main checkout is still on `divine/ticket-prefix-review`.** It stays stale until someone switches it to an
  up-to-date `develop`. The new warning will say so on every command.
- **Rollback:** revert the PR. No data or schema change.

# Screenshots

N/A: no UI.

# UI checklist

N/A: no UI changes.

# Harness changes, if any

The whole PR is a harness change: `t:start`, `t:next`, the on-demand database start and the stale-harness warning.
