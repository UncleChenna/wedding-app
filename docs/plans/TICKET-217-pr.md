# Ticket

Ticket: TICKET-217

# Summary

The owner asked for a lighter process. In one session, an approved, generated, additive migration (TICKET-084) kept an
agent stuck for hours, because only a hand-written approval file could clear the stop hook. Routine shell commands were
refused, and every PR ran the full verify twice.

After this PR:

- **Generated migrations go through.** New `pnpm db:generate` output needs no approval. Migrations already on
  `develop` stay locked, and destructive SQL still needs the owner's yes.
- **Hooks report instead of trapping.** Post-tool and stop hooks report protected files rather than failing. The commit
  hook is the enforcement point.
- **Throwaway writes are allowed.** `/dev/null`, temp folders and the agent scratchpad can be written, and heredoc
  bodies are read as data. Other checkouts stay off limits.
- **One full verify, in CI.** `t:pr` runs `verify:quick` (`--full` runs the whole suite locally) and readies an
  existing draft PR.
- **Agents merge their own green PRs** into `develop`, unless the owner asks to review first.
- **One write-up per ticket.** The PR body is the single write-up; handoffs are only for unfinished work.
- **Lighter UI evidence for admin and staff screens:** one theme at 375px, plus axe in every theme.
- **A light lane for small fixes:** about 50 lines, no schema, RLS, CI or dependency change, and no ticket file.

# Changes

- **`scripts/harness/core.mjs`:** `migrationPath`, `destructiveSql` and `journalOnlyAppends`.
- **`scripts/harness/hooks.mjs`:**
  - `generatedMigration` compares against the merge-base with `origin/develop`. New migration and snapshot files pass,
    and the journal passes while it only appends. Destructive SQL is refused at commit.
  - `warnProtected` is used by the post and stop hooks.
  - Scratch paths (`/dev/null`, `os.tmpdir()`, `/tmp`, `/var/folders`) are allowed outside the checkout.
- **`scripts/harness/shell-access.mjs`:** `withoutHeredocBodies`. The redirect target on the heredoc line itself is
  still checked.
- **`scripts/tickets.ts` and `scripts/tickets/review.ts`:** `reviewVerifyScript` (`verify:quick` unless `--full`),
  and `t:pr` runs `gh pr ready` on an existing PR.
- **Docs:**
  - AGENTS.md: rules, light lane, merging, steps 4–8.
  - CLAUDE.md.
  - `docs/collaboration.md`: PR flow and a new "Protected files" section.
  - `docs/tickets.md`: the merge rule, the single write-up and a "Light lane" section.
  - `docs/ui-checklist.md` and `docs/design-principles.md`: the admin and staff scope.
  - Skills: `ticket-workflow`, `implement-task`, `db-migration`.
  - `docs/learnings.md` and `docs/current-state.md`.
- **Tests:**
  - New: `scripts/__tests__/hooks-migrations.test.ts`.
  - Updated: `scripts/__tests__/hooks.test.ts` and `scripts/__tests__/ticket-review.test.ts`.

# Acceptance criteria and evidence

- [x] **New generated migration files pass the hooks; editing an already-committed one is still refused.**
  - `hooks-migrations.test.ts`: a throwaway repo commits a new `0001_*.sql`, its snapshot and an appended journal with
    no approval file.
  - Committing an edited `0000_init.sql` or a rewritten journal is refused.
  - `hooks.test.ts`: `cp x drizzle/0000_init.sql` and `mv drizzle/0000_init.sql …` are refused, and
    `cp x drizzle/9999_new-migration.sql` is allowed.
- [x] **Destructive migration SQL is detected.** 12 `destructiveSql` cases:
  - flagged: DROP TABLE or COLUMN, retype, TRUNCATE, DELETE FROM, RENAME
  - not flagged: CREATE, ADD COLUMN, DROP INDEX or CONSTRAINT, and commented-out SQL
  - the commit hook refuses a new `DROP TABLE` migration with "Ask the owner first".
- [x] **The stop hook no longer fails on files awaiting approval.** A changed lockfile gives `stop` exit 0 with
      "Note: Protected file pnpm-lock.yaml", and the same file is still refused at commit. The post hook behaves the same
      way. A failing `verify:quick` still fails the stop hook (existing test unchanged).
- [x] **`2>/dev/null`, heredocs and scratchpad writes are allowed; `.env` and lockfile writes are still refused.** New
      shell cases cover:
  - `ls 2>/dev/null`, `ls > /dev/null 2>&1`, `cp x /tmp/…` and a heredoc containing `=>` or `>`: allowed
  - `printf hello > pnpm-lock.yaml`, `cat > .env.local <<EOF`, and writing into a sibling directory outside the
    checkout: refused
  - all existing secret cases unchanged
- [x] **`t:pr` runs `verify:quick` by default and the full verify with `--full`.** Covered by the `reviewVerifyScript`
      test, with both call sites (`t:pr` and `t:move … in_review`) using it.
- [x] **The docs and skills describe the new rules.** See Changes.

# Verification

- `vitest run scripts/__tests__`: 229 passed, 100 opt-in skips.
- `pnpm typecheck`: clean. ESLint and Prettier ran on every changed file through the hooks.
- `t:pr` on this branch used the new quick path; CI's full `pnpm verify` is the gate.
- **Not verified:** the Cursor adapter's stop follow-up with the new warning. It only prints on stderr, which Cursor
  ignores; the behaviour is unchanged for real failures.

# Risks and rollout

- **Loosened on purpose, at the owner's request.**
  - A hand-written new migration file now passes the hooks like generated output. The `db-migration` skill still
    requires the generator, and CI's migrations job applies every migration.
  - Writes to temp folders are allowed outside the checkout.
  - Agents may merge their own green PRs into `develop`.
- **Still enforced:**
  - secrets: no reads or writes
  - lockfiles and generated schemas
  - edits to migrations already on `develop`
  - destructive SQL
  - no direct pushes to `develop` or `main`
  - CI as the merge gate
  - no merging another owner's PR
  - no AI attribution
- **Rollback:** revert this PR. No data, schema or CI change.

# Screenshots

N/A: no UI.

# UI checklist

N/A: no UI changes.

# Harness changes, if any

The whole PR is a harness change: `scripts/harness/hooks.mjs`, `core.mjs`, `shell-access.mjs` and the `t:pr` verify
step, plus the matching docs and skills.
