# Ticket

Ticket: WED-001

# Summary

**Problem.** The post-tool hook passed every changed path to Prettier, including the `.claude/skills` symlink that `pnpm agents:link` creates. Prettier refuses symlinks, so every agent tool call reported a blocking PostToolUse error.

**Change.**

- `scripts/harness/hooks.mjs` formats only regular files; symlinks and directories are skipped.
- `scripts/agents-link.mjs --check` fails, with the fix-up command, if `.claude/skills` is ever committed. It is generated per clone and gitignored.
- `scripts/__tests__/git-env.ts` adds `isolatedGitEnv()`, now used by every test that spawns git.
  - Git exports `GIT_DIR`/`GIT_INDEX_FILE` while running hooks, so tests run by the pre-commit gate acted on the real repository.
  - During this ticket the first version of the new test committed a fixture to the branch (undone before push) and set `core.bare=true` in the shared `.git/config`.
  - The same latent bug was in `tickets.test.ts`.

**Validation.**

- New hook test fails on the old code and passes on the new.
- The script suite run with `GIT_DIR`/`GIT_INDEX_FILE` pointed at a decoy repo leaves the decoy's HEAD and config unchanged.
- `agents:check` passes in a fresh clone and fails when `.claude/skills` is force-added.
- The unfixed hook reproduced the exact error in a fresh clone.

**Needs a human.** Restore the shared repo config in the primary clone: `git config --file .git/config core.bare false`.

Stacked on `chore/ticket-system` (PR #1 was closed after the history rewrite); GitHub retargets this to `main` when that branch merges.

# Screenshots

N/A: no UI change (hook scripts and tests only).

# UI checklist

N/A for every item: no UI change.

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
- [x] **Verification:** `pnpm verify` passed: 168 tickets valid, format, lint, typecheck, 70 unit tests, build, 17 smoke tests.

# Harness changes, if any

- Hooks: post-tool formatter skips non-regular files.
- `agents:check`: rejects a committed `.claude/skills`.
- Tests: `isolatedGitEnv()` is required for any test that runs git (lesson added to `docs/learnings.md`).
