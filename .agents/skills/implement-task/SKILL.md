---
name: implement-task
description: Use when implementing a TICKET ticket's code or docs; wraps ticket-workflow with the build and verification details.
---

# Implement Task

Follow the `ticket-workflow` skill for picking, claiming, worktrees, status moves, PRs and closing. This skill covers step 5 (build) in detail.

1. Complete the [mandatory before-coding check](../../../AGENTS.md#mandatory-check-before-coding), including the live task list and roadmap; repeat it if scope changes. Read root instructions, `docs/collaboration.md`, `docs/learnings.md`, recent `docs/progress.md`, the ticket (`pnpm t:show <id>`), its PRD links and `docs/current-state.md`.
2. Confirm you are in `.worktrees/<id>` on the branch named exactly for the ticket ID and the ticket is `in_progress` and owned by you. If not, go back to `ticket-workflow` steps 1–4.
3. Write `docs/plans/YYYY-MM-DD-<id>.md`: acceptance, files, tests, risks. Write and run failing behavioural tests before implementation; documentation-only changes use link/format checks.
4. Implement the smallest complete change within the ticket's scope. Read installed Next.js docs before framework code. For UI use `ui-review`; for schema use `db-migration`; for themes use `new-theme`.
5. Run `pnpm verify:quick` then `pnpm verify`. Fix failures without weakening checks. If blocked, `pnpm t:move <id> blocked --reason "…" --push`, write a handoff and stop.
6. Commit in small steps with subjects starting `<id>: `. No AI attribution. Push.
7. Tick only the acceptance criteria you proved, append dated notes, write `docs/plans/<id>-pr.md` from the PR template with evidence, update docs/ADRs, prepend a handoff, then `pnpm t:pr <id>` to open a detailed PR into `develop`. Include changes, acceptance evidence, actual test results, limitations and rollout/rollback steps. Leave merging to the human; never enable auto-merge. If GitHub/auth is unavailable, leave a reviewable pushed branch and report the missing prerequisite; do not claim a PR exists.
