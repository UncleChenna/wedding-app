---
name: ticket-workflow
description: Use for every piece of work: pick, claim, isolate, build, review, close or block a TICKET ticket. Never work without a claimed ticket.
---

# Ticket Workflow

One ticket at a time, one worktree per ticket. Rules: [docs/tickets.md](../../../docs/tickets.md). Use your real name as `<you>` and your agent (`claude`, `codex`, `cursor`) as `<agent>`.

1. **Review and pick.** First complete the mandatory before-coding check in [AGENTS.md](../../../AGENTS.md#mandatory-check-before-coding): review the live board, roadmap, current handoff, intended ticket and its dependencies/PRD. Confirm scope, ownership and readiness, then state the ticket ID, outcome and verification plan. From the primary checkout: `pnpm t:next` (add `--module <m>` for your area; `human` tickets are skipped). Read the ticket, its PRD links and its blockers with `pnpm t:show <id>`.
2. **Start.** `pnpm t:start <id> --agent <agent>`. It claims the ticket (moving it from backlog to todo first if needed), creates `.worktrees/<id>` on branch `<id>`, installs, then commits and pushes `<id>: move to in_progress` so the other developer sees it. A failure ("already claimed" or "blocked by") means pick another ticket. For a ticket that `t:next` lists under "Can start ahead", add `--ahead` (see docs/tickets.md, "Working ahead") and keep the PR a draft until its blockers merge.
3. **Isolate.** `cd .worktrees/<id>` and run your agent there; never share an editing checkout. The database starts on the first `pnpm db:migrate`/`db:seed` (`t:start --db` starts it at once).
4. **Tools current.** If a command warns that the checkout's tools are behind `origin/develop`, use an up-to-date checkout or the new worktree for later `t:*`/`wt:*` commands.
5. **Build.** A plan file is optional. Read the installed Next.js docs before framework code. Write tests, implement, run `pnpm verify:quick`. Commit in small steps; every subject starts `<id>: `, e.g. `TICKET-014: add RSVP form validation`. Push often. UI work follows the `ui-review` skill; schema work follows `db-migration`.
6. **Finish.** Tick every acceptance criterion in `tickets/<id>-*.md` (only ones you proved). Write `docs/plans/<id>-pr.md` from `.github/pull_request_template.md` with evidence. This is the single write-up; no separate handoff or review file is needed for finished work. Commit both, then run `pnpm t:pr <id>`. It runs `verify:quick` (`--full` for the whole suite), pushes, opens or readies the PR titled `<id>: <title>` targeting `develop`, moves the ticket to `in_review` and pushes again. CI runs the full `pnpm verify`.
7. **Review changes.** If the reviewer asks for changes: `pnpm t:move <id> in_progress --reason "<what was asked>" --push`, fix, then `pnpm t:pr <id>` again.
8. **Merge and close.** When every required CI check on your own PR is green, merge it into `develop` (`gh pr merge <n> --merge`), unless the owner asked to review it first. Then `pnpm t:move <id> done`. This records the completion date and PR link in the shared ledger, and only that ticket’s own branch may sync its file. Never copy completion metadata into unrelated branches. Then, from the primary checkout, `pnpm wt:remove <id>`.
9. **Blocked?** `pnpm t:move <id> blocked --reason "<blocking ticket or question>" --push`, add a note, then pick another ticket. When it clears: `pnpm t:move <id> <previous status> --push`. Never skip anything silently.
10. **Hand off.** Only when work is unfinished or changing hands: write `docs/handoffs/<ticket-id>.md` (the `handoff` skill) and push a draft PR listing what remains.

Fill every task-specific PR section with changes, acceptance evidence, test results, untested cases, risks and rollout/rollback details. Never merge another owner's PR, never merge on red or pending checks, and never enable auto-merge. Small fixes may use the light lane in [docs/tickets.md](../../../docs/tickets.md#light-lane) instead of a ticket.

Never leave finished work unpushed. Never mark a ticket done with failing checks or unticked criteria. Never edit another owner's in-progress ticket. No AI attribution in commits, PRs or comments.
