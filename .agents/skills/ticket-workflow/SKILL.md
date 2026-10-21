---
name: ticket-workflow
description: Use for every piece of work: pick, claim, isolate, build, review, close or block a TICKET ticket. Never work without a claimed ticket.
---

# Ticket Workflow

One ticket at a time, one worktree per ticket. Rules: [docs/tickets.md](../../../docs/tickets.md). Use your real name as `<you>` and your agent (`claude`, `codex`, `cursor`) as `<agent>`.

1. **Review and pick.** First complete the mandatory before-coding check in [AGENTS.md](../../../AGENTS.md#mandatory-check-before-coding): review the live board, roadmap, current handoff, intended ticket and its dependencies/PRD. Confirm scope, ownership and readiness, then state the ticket ID, outcome and verification plan. From the primary checkout: `pnpm t:next` (add `--module <m>` for your area; `human` tickets are skipped). Read the ticket, its PRD links and its blockers with `pnpm t:show <id>`.
2. **Claim.** `pnpm t:claim <id> --owner <you> --agent <agent>`. A failure ("already claimed" or "blocked by") means pick another ticket; never work around it.
3. **Isolate.** `pnpm wt:new <id>`, then `cd .worktrees/<id>`. The branch is exactly `<id>` (for example `TICKET-188`), with no owner prefix or slug. Run your agent there; never share an editing checkout.
4. **Start.** `pnpm t:move <id> in_progress --push`. This commits the ticket change as `<id>: move to in_progress` and pushes immediately, so the other developer sees it.
5. **Build.** Write a dated plan in `docs/plans/`. Read the installed Next.js docs before framework code. Write failing tests, implement, run `pnpm verify:quick` then `pnpm verify`. Commit in small steps; every subject starts `<id>: `, e.g. `TICKET-014: add RSVP form validation`. Push often. UI work follows the `ui-review` skill; schema work follows `db-migration`.
6. **Finish.** Tick every acceptance criterion in `tickets/<id>-*.md` (only ones you proved). Append dated notes and decisions. Write `docs/plans/<id>-pr.md` from `.github/pull_request_template.md` with evidence, and commit both. Then run `pnpm t:pr <id>`. It runs `pnpm verify`, pushes, opens the PR titled `<id>: <title>` targeting `develop`, moves the ticket to `in_review` and pushes again.
7. **Review changes.** If the reviewer asks for changes: `pnpm t:move <id> in_progress --reason "<what was asked>" --push`, fix, then `pnpm t:pr <id>` again.
8. **Close.** After the human reviews and merges the PR into `develop`: `pnpm t:move <id> done`. This records the completion date and PR link in the shared ledger, and the file catches up on your next ticket branch. Then, from the primary checkout, `pnpm wt:remove <id>`.
9. **Blocked?** `pnpm t:move <id> blocked --reason "<blocking ticket or question>" --push`, add a note, then pick another ticket. When it clears: `pnpm t:move <id> <previous status> --push`. Never skip anything silently.
10. **Hand off.** Before ending any session, prepend an entry to `docs/progress.md` (the `handoff` skill).

Every handoff must have pushed work and a linked PR to `develop` (draft if unfinished). Fill every task-specific PR section with changes, acceptance evidence, test results, untested cases, risks and rollout/rollback details. Never merge or enable auto-merge; the human decides.

Never leave finished work unpushed. Never mark a ticket done with failing checks or unticked criteria. Never edit another owner's in-progress ticket. No AI attribution in commits, PRs or comments.
