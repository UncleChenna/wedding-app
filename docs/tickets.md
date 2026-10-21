# Tickets

All work is tracked as tickets in [`tickets/`](../tickets/). There is one Markdown file per ticket, validated by
`pnpm t:validate`. The board is [`tickets/BOARD.md`](../tickets/BOARD.md) and the plan is
[`tickets/ROADMAP.md`](../tickets/ROADMAP.md); both are generated. The day-to-day procedure is the
[`ticket-workflow` skill](../.agents/skills/ticket-workflow/SKILL.md). The design rationale is in
[ADR 0013](decisions/0013-ticket-system.md).

## Files

`tickets/TICKET-NNN-short-slug.md`. Ids are sequential and are never reused or deleted: cancel a ticket instead. The slug
is fixed when the ticket is created. Start from [`tickets/TEMPLATE.md`](../tickets/TEMPLATE.md) using `pnpm t:new`.
`tickets/` is excluded from Prettier because the CLI rewrites these files and they must round-trip exactly.

### Frontmatter

| Field                                        | Meaning                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `id`                                         | `TICKET-NNN`                                                                               |
| `title`                                      | Imperative, under 70 characters, no trailing punctuation                                   |
| `epic`                                       | One of the epics in `scripts/tickets/model.ts` (listed in ROADMAP.md)                      |
| `status`                                     | See statuses below                                                                         |
| `priority`                                   | `urgent`, `high`, `medium`, `low`                                                          |
| `estimate`                                   | `S`, `M`, `L`. L is the maximum, about half a day of agent work; split anything bigger     |
| `labels`                                     | `frontend`, `backend`, `db`, `pwa`, `infra`, `test`, `design`, `docs`, `security`, `human` |
| `module`                                     | `invitations`, `checkin`, `ordering`, `admin`, `theming`, `shared`, `harness`, `ops`       |
| `owner`, `agent`                             | Who claimed it and which agent works on it; empty until claimed                            |
| `blocked_by`                                 | Ticket ids that must be `done` first                                                       |
| `blocks`                                     | Derived inverse of `blocked_by`; `pnpm t:render` maintains it                              |
| `branch`, `pr`                               | Set by claim and review; the branch always contains the ticket id                          |
| `created`, `updated`, `started`, `completed` | `YYYY-MM-DD`                                                                               |
| `reason`, `resume_to`                        | Set only while `blocked` (why, and the status to return to) or `cancelled` (why)           |

### Body sections (all required, in this order)

Context (with a PRD link) · Scope · Out of scope · Acceptance criteria (`- [ ]` testable checkboxes only) · Test plan
(unit / end-to-end / manual) · Files likely touched · Notes / decisions (agents append dated notes) · Activity log
(one dated line per status change; the CLI writes these).

## Statuses and transitions

```text
backlog → todo → in_progress → in_review → done
                     ↑              │
                     └──────────────┘  (review asks for changes, --reason)
todo | in_progress | in_review → blocked → (back to the same status)
anything except done → cancelled (--reason)
```

| Move                      | Rule enforced by `pnpm t:move`                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backlog → todo`          | Always allowed                                                                                                                                      |
| `todo → in_progress`      | You claimed it, every `blocked_by` ticket is `done`, and you are on the ticket's branch                                                             |
| `in_progress → in_review` | Every acceptance criterion is ticked, the tree is clean, the branch is pushed, a PR is open, and `pnpm verify` passes. `pnpm t:pr` does all of this |
| `in_review → in_progress` | `--reason` gives the requested changes                                                                                                              |
| `in_review → done`        | The PR is merged (checked with `gh`) and every criterion is ticked in the merged file on `main`                                                     |
| `→ blocked`               | From todo, in_progress or in_review, with `--reason` naming the blocking ticket or question                                                         |
| `blocked → previous`      | Only back to the recorded `resume_to`                                                                                                               |
| `→ cancelled`             | `--reason` required. `done` is final                                                                                                                |

Only the owner may move a claimed ticket. Nobody edits another owner's in-progress ticket.

## Live state: the ticket ledger

Ticket files on `main` hold definitions and history. Live claims and status changes are also written atomically to
the `ticket-ledger` branch on `origin`, using a compare-and-swap push (ADR 0011's design, now ADR 0013). Every
`t:*` read overlays the ledger on the files, so:

- Two developers (or agents) can never claim the same ticket. The second claim fails with "already claimed".
- `t:next` and `t:board` show claims and progress that have not reached `main` yet.
- `done` is recorded the moment the PR is merged. Branch protection forbids direct commits to `main`, so the file
  catches up through the next ticket branch: `t:move <id> in_progress` syncs finished tickets into that branch. You can
  also run `pnpm t:sync` on a small bookkeeping branch.

Commands that change state fail closed if `origin` is unreachable. `TICKETS_LEDGER=off` uses files only, for a solo
offline session; `TICKETS_LEDGER=local` is for tests. Ticket files are only rewritten on a branch, never on `main`, so
the coordination checkout stays clean.

## Commands

| Command                                                                                           | Does                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm t:list [--status s] [--epic e] [--module m] [--owner o] [--label l] [--json]`               | Table of tickets (live)                                                                                                     |
| `pnpm t:board`                                                                                    | Terminal kanban (live)                                                                                                      |
| `pnpm t:next [--module m] [--human] [--json]`                                                     | Best `todo` ticket with every blocker done. Skips `human` tickets unless `--human`                                          |
| `pnpm t:show <id> [--json]`                                                                       | One ticket (live)                                                                                                           |
| `pnpm t:claim <id> --owner <name> --agent <name>`                                                 | Atomic claim; fails if claimed or blocked                                                                                   |
| `pnpm t:release <id>`                                                                             | Owner gives back a claimed `todo` ticket                                                                                    |
| `pnpm t:move <id> <status> [--reason text] [--push]`                                              | Enforced transition; `--push` commits `tickets/` as `TICKET-NNN: move to <status>` and pushes                               |
| `pnpm t:pr <id>`                                                                                  | Verify, push, open the PR (title `TICKET-NNN: <title>`, body from `docs/plans/TICKET-NNN-pr.md`), move to `in_review`, push |
| `pnpm t:new --title … --epic … --module … [--priority --estimate --labels --blocked-by --status]` | Scaffold the next id                                                                                                        |
| `pnpm t:sync`                                                                                     | Write ledger state into ticket files (on a branch)                                                                          |
| `pnpm t:validate`                                                                                 | Schema, sections, unique and contiguous ids, real dependencies, no cycles, status/branch/PR consistency, boards fresh       |
| `pnpm t:render`                                                                                   | Recompute `blocks`, regenerate BOARD.md and ROADMAP.md                                                                      |

`owner` defaults to `git config harness.owner` or `AGENT_OWNER`. `agent` defaults to `TICKETS_AGENT`.

## Enforcement

- `t:validate` runs in the pre-commit hook, as the first step of `pnpm verify`, and in CI (`tickets` job and
  `verify`).
- The pre-commit hook runs `t:render --staged` first, so hand edits keep BOARD.md and ROADMAP.md fresh.
- The `commit-msg` hook requires `TICKET-NNN: …` subjects on ticket branches and rejects AI attribution.
- If two merged PRs both regenerate BOARD.md, resolve the conflict by taking either side and running `pnpm t:render`.

## The `human` label

`human` marks decisions, accounts and physical tasks: domain, colours, photos, WhatsApp API, Supabase, Vercel, Sentry,
email provider, the venue visit, kit, printing, training, rehearsal, sending IVs. They are prioritised early and
listed under "Waiting on people" in BOARD.md, and agents skip them in `t:next`. An agent may prepare documents for a
human ticket and record its outcome. A person makes the decision, and creates any account or spends any money.

## Prefix migration

Canonical ticket IDs, filenames and new branch/commit examples use `TICKET-NNN`.
The CLI also accepts old `WED-NNN` arguments during rollout. Existing branch names
are not renamed automatically. The shared coordination ledger deliberately retains
its original `WED-NNN` storage keys: both tool versions therefore consult and update
the same claim, rather than creating independent claims for one ticket. These are
internal compatibility keys, not the visible ticket names. Keep this boundary until
all older worktrees are retired; do not rename ledger keys independently.
