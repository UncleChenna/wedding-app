---
id: TICKET-001
title: Fix hooks failing on the symlinked .claude/skills directory
epic: foundations
status: done
priority: urgent
estimate: S
labels: [infra, test]
module: harness
owner: unclechenna
agent: claude
blocked_by: []
blocks: [TICKET-003, TICKET-006]
branch: TICKET-001
pr: https://github.com/UncleChenna/wedding-app/pull/7
created: 2026-10-21
updated: 2026-10-21
started: 2026-10-21
completed: 2026-10-21
reason: ""
resume_to: ""
---

# TICKET-001: Fix hooks failing on the symlinked .claude/skills directory

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

- 2026-10-21: Root cause: the post-tool hook passed every changed path to Prettier, including the `.claude/skills` symlink, and Prettier refuses symlinks. Fix: only regular files are formatted (`lstatSync(...).isFile()`).
- 2026-10-21: Index vs ignore: `.claude/skills` is ignored and untracked on develop. `pnpm agents:check` now fails with a fix-up command if it is ever committed (proved by force-adding it in a fresh clone). `.gitignore` needed no change.
- 2026-10-21: Incident during the first attempt: a test ran `git init/commit` without clearing `GIT_DIR`/`GIT_INDEX_FILE`; run by the pre-commit gate it set `core.bare=true` in the shared `.git/config` (since restored; now `false`). Fix: `scripts/__tests__/git-env.ts` `isolatedGitEnv()`, used by every git-spawning test including `tickets.test.ts`.
- 2026-10-21: Redone on branch `TICKET-001` against `develop`. The first attempt (PR #3, branch `unclechenna/WED-001-…`) targeted the retired `chore/ticket-system` branch and conflicted on ticket bookkeeping after HARNESS-002 merged; code commits were cherry-picked unchanged apart from the test label.
- 2026-10-21: Evidence: regression test fails on the old hook (`pnpm exec prettier --write --ignore-unknown .claude/skills failed`) and passes with the fix; hook run on this worktree prints `{}` and exits 0; `agents:check` exits 0 in a fresh clone and 1 with `.claude/skills` committed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-10-21 — todo → claimed — unclechenna (claude)
- 2026-10-21 — todo → in_progress — unclechenna (claude)
- 2026-10-21 — in_progress → in_review — unclechenna (claude)
- 2026-10-21 — in_review → in_progress — unclechenna (claude) — PR #3 conflicted and targeted chore/ticket-system; redoing on TICKET-001 against develop
- 2026-10-21 — in_progress → in_review — unclechenna (claude)
- 2026-10-21 — in_review → done — unclechenna (claude)
