# 0013 — In-repo tickets with a shared claim ledger

- Status: Accepted · 2026-10-21 · supersedes the `docs/tasks.json` parts of 0008 and 0011

**Context.** `docs/tasks.json` held 7 tasks with no body, no priorities or estimates, no dependency graph beyond
`dependsOn`, and statuses `todo → claimed → in_review → done`. The project needs about 170 tickets across 16 epics, a
Linear-style workflow (backlog, blocked, cancelled), rich bodies, a board, a critical path and enforcement in hooks and
CI. Two developers with several agents work in parallel, so claims must be atomic across machines. `main` is
protected, so status changes cannot be committed straight to it.

**Decision.**

- One Markdown file per ticket in `tickets/`, with frontmatter in a strict YAML subset validated by Zod
  (`scripts/tickets/model.ts`). A CLI (`scripts/tickets.ts`, `pnpm t:*`) owns every write, so files round-trip
  exactly. `tickets/` is excluded from Prettier.
- Statuses `backlog`, `todo`, `in_progress`, `in_review`, `done`, `blocked`, `cancelled`, with a fixed transition
  table and preconditions checked by pure functions (`scripts/tickets/workflow.ts`): claimed and unblocked to start;
  ticked criteria, clean pushed tree, open PR and passing `pnpm verify` for review; merged PR for done.
- The ADR 0011 compare-and-swap ledger is kept but generalised to `origin/ticket-ledger` (`ledger.json`: live status,
  owner, agent, branch, PR, dates and activity lines per ticket, plus the highest allocated id). Reads overlay it on
  the files; writes go to the ledger first, then to the ticket file only when the checkout is on a branch.
- `done` lands in the ledger at merge time. Files catch up when the next ticket starts (`t:move … in_progress` syncs
  finished tickets into that branch) or through `t:sync`, because branch protection forbids direct commits to `main`.
- `tickets/BOARD.md` and `tickets/ROADMAP.md` are generated from the files only, deterministically, with no dates. They
  are checked for freshness by `t:validate`.
- Rejected: a hosted tracker (Linear or GitHub Projects), because agents could not validate it offline and it adds an
  account; JSON in one file, because of merge conflicts and no room for bodies; status only in files, because it is
  invisible to the other developer until merge and gives no atomic claims.

**Consequences.** Every state change needs network access to `origin` (fails closed; `TICKETS_LEDGER=off` for solo
offline work). Ticket files on `main` lag the ledger until the next branch lands. Parallel PRs that both regenerate
BOARD.md conflict; resolve with `pnpm t:render`. The old `pnpm task:*` commands, `scripts/task.mjs`,
`scripts/task-pr.mjs` and `docs/tasks.json` are removed; their open tasks became tickets (see each ticket's notes).
Reversal: export the ledger and files to a tracker and delete `tickets/`.

**Validation.** `scripts/__tests__/tickets.test.ts` covers the format round trip, every validation rule, the
transition table, graph ordering and critical path, commit rules, and two clones racing a claim against a bare remote.
`pnpm t:validate` passes on the 168-ticket backlog. The race has not yet been run against GitHub (WED-007).
