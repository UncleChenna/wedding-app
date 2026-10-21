---
id: WED-001
title: Fix hooks failing on the symlinked .claude/skills directory
epic: foundations
status: in_progress
priority: urgent
estimate: S
labels: [infra, test]
module: harness
owner: unclechenna
agent: claude
blocked_by: []
blocks: [WED-006]
branch: unclechenna/WED-001-fix-hooks-failing-on-the-symlinked-claude-skills
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: ""
reason: ""
resume_to: ""
---

# WED-001: Fix hooks failing on the symlinked .claude/skills directory

## Context

The post-tool hook runs `prettier --write .claude/skills`, which fails on the symlink, so every agent tool call reports a blocking error. `.claude/skills` is also both gitignored and committed.

See: [Current state](../docs/current-state.md) · [Working together](../docs/collaboration.md).

## Scope

- Skip symlinks and directories in the post-tool format step.
- Decide whether `.claude/skills` is committed or generated; make `.gitignore` and the index agree.
- Regression test in `scripts/__tests__/hooks.test.ts`.

## Out of scope

- Changing which skills exist.

## Acceptance criteria

- [x] A post-tool hook run with `.claude/skills` present exits 0 and prints `{}`.
- [x] `git check-ignore .claude/skills` and `git ls-files .claude/skills` no longer contradict each other.
- [x] A unit test fails on the old behaviour and passes on the new.
- [x] `pnpm agents:check` passes in a fresh clone.

## Test plan

- Unit: hooks.test.ts runs `hooks.mjs post` against a temp repo containing a symlinked skills dir.
- Manual: Run any Bash tool call in Claude Code and confirm no PostToolUse error appears.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/harness/hooks.mjs`
- `scripts/__tests__/hooks.test.ts`
- `.gitignore`

## Notes / decisions

- 2026-10-21: Root cause: the post-tool hook passed every changed path to Prettier, including the `.claude/skills` symlink, and Prettier refuses symlinks. Fix: only regular files are formatted (`lstatSync(...).isFile()`). Reproduced with the unfixed hook in a fresh clone (the exact "is a symbolic link" error), then fixed.
- 2026-10-21: Index vs ignore: the history rewrite already dropped `.claude/skills` from git, so it is now ignored and untracked. `pnpm agents:check` now fails with a fix-up command if it is ever committed again (proved by force-adding it in a clone). `.gitignore` needed no change.
- 2026-10-21: Incident: the first version of the new test ran `git init/commit` in a temp dir without clearing `GIT_DIR`/`GIT_INDEX_FILE`. Run by the pre-commit gate, it committed a fixture to this branch (undone with a mixed reset before any push) and set `core.bare=true` in the shared `.git/config`. That setting still needs a human to restore it (`git config --file .git/config core.bare false`); the agent was not permitted to change shared config. Fix: `scripts/__tests__/git-env.ts` `isolatedGitEnv()`, now used by every git-spawning test, including `tickets.test.ts`. Proved by running the script suite with `GIT_DIR` pointed at a decoy repo: decoy HEAD and config unchanged.
- 2026-10-21: Evidence: `pnpm verify` passed (168 tickets valid, 70 unit tests, build, 17 smoke). Bash tool calls in this worktree no longer report PostToolUse errors.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — unclechenna (claude)
- 2026-10-21 — todo → in_progress — unclechenna (claude)
