---
name: implement-task
description: Use when implementing a queued project task, from atomic claim through isolated worktree and pull request.
---

# Implement Task

1. Read root instructions, `docs/collaboration.md`, `docs/learnings.md`, and recent progress. Select `pnpm task:next [module]`; read acceptance and dependencies.
2. Run `pnpm task:claim <id>` before editing. A duplicate claim must fail. If already assigned to this session, verify owner/branch with `pnpm task:show <id>` instead of reclaiming.
3. Run `pnpm wt:new <id>` and enter `.worktrees/<id>`. Never share an editing checkout with another agent. Do not use an agent's automatic worktree mode on top of this checkout.
4. Write `docs/plans/YYYY-MM-DD-<id>.md`: acceptance, files, tests, risks. Write and run failing behavioural tests before implementation; documentation-only changes use link/format checks.
5. Implement the smallest complete change. Read installed Next.js docs before framework code. For UI use `ui-review`; for schema use `db-migration`.
6. Run `pnpm verify:quick` then `pnpm verify`. Fix failures without weakening checks. If blocked, retain the claim, record `blocked_reason` and a handoff, and stop; do not label the work done.
7. Update docs, prepend a dated handoff, and commit only task files using a conventional message. Claims are separate metadata commits.
8. Run `pnpm task:pr <id>` to verify independently, push the task branch, open a PR via `gh`, and mark the claim in_review. If GitHub/auth is unavailable, leave a reviewable commit and report the missing prerequisite; do not claim a PR exists.
9. The other developer reviews. After merge, run `pnpm task:finish <id>` and remove the disposable worktree. Only merged work becomes done.
