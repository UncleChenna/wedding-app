# Ticket

Ticket: TICKET-001

# Summary

**Problem.** Every agent tool call reported a blocking PostToolUse error. The post-tool hook passed every changed path to Prettier, including the `.claude/skills` symlink that `pnpm agents:link` creates, and Prettier refuses symlinks. A second, related bug surfaced while fixing it: tests that spawn git inherited `GIT_DIR`/`GIT_INDEX_FILE` when run from the pre-commit hook, so they could act on the real repository (one run set `core.bare=true` in the shared git config).

**Result.** The hook formats only regular files and exits cleanly with `.claude/skills` present; `agents:check` rejects a committed `.claude/skills`; git-spawning tests are sandboxed.

This replaces PR #3 (`WED-001`), which targeted the retired `chore/ticket-system` branch and conflicted on ticket bookkeeping after HARNESS-002 merged. The code commits are cherry-picked unchanged except for the test label.

# Changes

- `scripts/harness/hooks.mjs`: skip any path that is not a regular file (`lstatSync(...).isFile()`) before running Prettier/ESLint.
- `scripts/agents-link.mjs`: `--check` fails, with the fix-up command, if `.claude/skills` is tracked by git. It is generated per clone and gitignored.
- `scripts/__tests__/git-env.ts`: new `isolatedGitEnv()` strips inherited `GIT_*` variables; used by `hooks.test.ts` and `tickets.test.ts` (every test that spawns git).
- `scripts/__tests__/hooks.test.ts`: regression test for the symlink case, and a test that `isolatedGitEnv()` drops `GIT_DIR`/`GIT_INDEX_FILE`.
- Docs: plan in `docs/plans/2026-10-21-TICKET-001-symlink-hook.md`; lesson added to `docs/learnings.md`; ticket criteria and notes updated.

# Acceptance criteria and evidence

- [x] Post-tool hook with `.claude/skills` present exits 0 and prints `{}`: ran `hooks.mjs post claude` in this worktree with the symlink present → `{}`, exit 0.
- [x] `git check-ignore` and `git ls-files` agree: `check-ignore` prints `.claude/skills`; `ls-files .claude/skills` prints nothing.
- [x] Unit test fails on the old behaviour and passes on the new: with only the `hooks.mjs` change reverted, the new test fails with `pnpm exec prettier --write --ignore-unknown .claude/skills failed`; with it restored, all 11 hook tests pass.
- [x] `pnpm agents:check` passes in a fresh clone: exit 0 in a fresh clone of this branch; exit 1 with the expected message after force-adding `.claude/skills`.

# Verification

- `pnpm verify` passed: 188 tickets valid, Prettier clean, lint, typecheck, 79 unit tests in 13 files, production build, 17 browser smoke tests.
- Run with the public local defaults that CI sets as environment variables (this worktree has no local env file).
- Not separately verified on this branch: a live Claude Code session in this worktree. The equivalent hook invocation above was run directly.

# Risks and rollout

- Harness and tests only; no app, database or deployment change. No migration.
- Rollback: revert the PR. The only behavioural effect of reverting is the PostToolUse error returning.
- After merge, close PR #3 and delete branch `unclechenna/WED-001-fix-hooks-failing-on-the-symlinked-claude-skills` and its old worktree (`.worktrees/WED-001`).

# Screenshots

N/A: no UI change (hook scripts, tests and docs only).

# UI checklist

N/A for every item except verification: no UI change.

- [ ] **Screenshots:** N/A, no UI change.
- [ ] **Tokens:** N/A, no UI change.
- [ ] **Restraint and typography:** N/A, no UI change.
- [ ] **Mobile:** N/A, no UI change.
- [ ] **Motion:** N/A, no UI change.
- [ ] **Keyboard:** N/A, no UI change.
- [ ] **Contrast:** N/A, no UI change.
- [ ] **Load and images:** N/A, no UI change.
- [ ] **Performance:** N/A, no UI change.
- [ ] **Copy:** N/A, no UI change.
- [ ] **Shared components:** N/A, no UI change.
- [ ] **Sharing and devices:** N/A, no UI change.
- [ ] **QR codes:** N/A, no UI change.
- [ ] **Staff feedback:** N/A, no UI change.
- [x] **Verification:** `pnpm verify` passed (see above).

# Harness changes, if any

- Hooks: post-tool formatter skips non-regular files.
- `agents:check`: rejects a committed `.claude/skills`.
- Tests: `isolatedGitEnv()` is required for any test that runs git (lesson added to `docs/learnings.md`).
