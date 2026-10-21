# Plan: Fix hooks failing on the symlinked .claude/skills directory

- Ticket: TICKET-001
- Module(s): harness
- Date: 2026-10-21

## Goal

Stop the post-tool hook reporting a blocking error on every agent tool call, and keep `.claude/skills` generated rather than committed.

## Acceptance criteria

- [x] A post-tool hook run with `.claude/skills` present exits 0 and prints `{}`.
- [x] `git check-ignore .claude/skills` and `git ls-files .claude/skills` no longer contradict each other.
- [x] A unit test fails on the old behaviour and passes on the new.
- [x] `pnpm agents:check` passes in a fresh clone.

## Approach

1. `scripts/harness/hooks.mjs`: format only regular files (skip symlinks and directories).
2. `scripts/agents-link.mjs`: `--check` fails if `.claude/skills` is tracked.
3. `scripts/__tests__/git-env.ts`: strip inherited `GIT_*` variables for every test that spawns git.

This supersedes the first attempt in PR #3 (`WED-001`), which targeted the retired `chore/ticket-system` branch. Its code commits are cherry-picked onto `develop`.

## Tests first

- `hooks.test.ts`: a temp repo with a changed file and a new `.claude/skills` symlink, and a fake `pnpm` that fails on symlinks like Prettier. Fails on the old hook.
- `hooks.test.ts`: `isolatedGitEnv()` drops `GIT_DIR`/`GIT_INDEX_FILE`.

## Risks and open questions

- None outstanding. The `core.bare=true` left by the first attempt has already been restored.
