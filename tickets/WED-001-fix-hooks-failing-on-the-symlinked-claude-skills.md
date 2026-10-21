---
id: WED-001
title: Fix hooks failing on the symlinked .claude/skills directory
epic: foundations
status: todo
priority: urgent
estimate: S
labels: [infra, test]
module: harness
owner: ""
agent: ""
blocked_by: []
blocks: [WED-003, WED-006]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
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

- [ ] A post-tool hook run with `.claude/skills` present exits 0 and prints `{}`.
- [ ] `git check-ignore .claude/skills` and `git ls-files .claude/skills` no longer contradict each other.
- [ ] A unit test fails on the old behaviour and passes on the new.
- [ ] `pnpm agents:check` passes in a fresh clone.

## Test plan

- Unit: hooks.test.ts runs `hooks.mjs post` against a temp repo containing a symlinked skills dir.
- Manual: Run any Bash tool call in Claude Code and confirm no PostToolUse error appears.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `scripts/harness/hooks.mjs`
- `scripts/__tests__/hooks.test.ts`
- `.gitignore`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
