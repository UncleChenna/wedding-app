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
| `blocks`                                     | Legacy snapshot; reverse dependencies are derived in memory from `blocked_by`              |
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
| `in_review → done`        | The PR is merged (checked with `gh`) and every criterion is ticked in the merged file on `develop`                                                  |
| `→ blocked`               | From todo, in_progress or in_review, with `--reason` naming the blocking ticket or question                                                         |
| `blocked → previous`      | Only back to the recorded `resume_to`                                                                                                               |
| `→ cancelled`             | `--reason` required. `done` is final                                                                                                                |

Only the owner may move a claimed ticket. Nobody edits another owner's in-progress ticket.

## Live state: the ticket ledger

Ticket files on `develop` hold definitions and history. Live claims and status changes are also written atomically to
the `ticket-ledger` branch on `origin`, using a compare-and-swap push (ADR 0011's design, now ADR 0013). Every
`t:*` read overlays the ledger on the files, so:

- Two developers (or agents) can never claim the same ticket. The second claim fails with "already claimed".
- `t:next` and `t:board` show claims and progress that have not reached `develop` yet.
- `done` is recorded by the CLI after the human merges the PR. Live ledger state is authoritative; committed file status can lag.
- A transition writes only the branch’s own ticket. No unrelated completion records are copied into feature branches.
- `t:sync <id>` explicitly refreshes that ticket on its own branch; ordinary reads never edit tracked files.

Commands that change state fail closed if `origin` is unreachable. `TICKETS_LEDGER=off` uses files only, for a solo
offline session; `TICKETS_LEDGER=local` is for tests. Ticket files are only rewritten on a branch, never on `develop`, so
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
| `pnpm t:move <id> <status> [--reason text] [--push]`                                              | Enforced transition; `--push` commits only the assigned ticket as `TICKET-NNN: move to <status>` and pushes                 |
| `pnpm t:pr <id>`                                                                                  | Verify, push, open the PR (title `TICKET-NNN: <title>`, body from `docs/plans/TICKET-NNN-pr.md`), move to `in_review`, push |
| `pnpm t:new --title … --epic … --module … [--priority --estimate --labels --blocked-by --status]` | Scaffold the next id                                                                                                        |
| `pnpm t:sync <id>`                                                                                | Sync the named ticket only, on its own branch                                                                               |
| `pnpm t:validate`                                                                                 | Schema, sections, unique and contiguous ids, real dependencies, no cycles, status/branch/PR consistency                     |
| `pnpm t:render`                                                                                   | Generate ignored Markdown snapshots in `artifacts/tickets/`                                                                 |

`owner` defaults to `git config harness.owner` or `AGENT_OWNER`. `agent` defaults to `TICKETS_AGENT`.

## Enforcement

- `t:validate` runs in the pre-commit hook, as the first step of `pnpm verify`, and in CI (`tickets` job and
  `verify`).
- The legacy pre-commit `t:render --staged` call is a no-op for compatibility. Validation still runs; no hook stages generated files.
- The `commit-msg` hook requires `TICKET-NNN: …` subjects on ticket branches and rejects AI attribution.
- Feature PRs never regenerate tracked boards. Preserve their stable links. Reverse dependency fields are derived at read time; `blocked_by` remains the authoritative edge list. Dependency readiness is checked atomically by claim/move using the live ledger, not stale file statuses.

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

## Branch and PR contract

Every new ticket uses its exact ID as its branch, such as `TICKET-188`. Push to the same remote branch.
Keep the ticket ID in the Markdown filename, commit subjects and PR title (`TICKET-188: task title`).
One ticket produces one branch and PR; additional scope needs its own ticket. All PRs target `develop`.
Agents push progress and open a draft PR for unfinished handoffs; finished work must have a ready review PR.
Only the human reviews and merges, and agents never enable auto-merge or push directly to integration branches.

`pnpm t:pr` requires nonempty Summary, Changes, Acceptance criteria and evidence, Verification, and Risks and
rollout sections. Explain the before/after result, implementation details relevant to review, evidence for each
criterion, exact checks and outcomes, untested cases, and migration/rollback steps where relevant. Screenshots
are required for UI work. Keep the description current; a passing content check is not a substitute for a useful
review explanation. Legacy active branch names remain compatible; new claims always use the exact ticket ID.

## Visual dashboard

`pnpm t:dashboard` starts a read-only server at http://127.0.0.1:4173. Keep it running, or approve the optional VS Code folder-open task in a trusted workspace. Git reads run in a child process with a 12-second deadline, so an unavailable remote cannot block HTTP requests. Local ticket edits trigger a debounced refresh; a 20-second timer checks ledger updates even without edits. The browser checks the server every two seconds and preserves search, filters, theme and open details. Last-success time, connection status, checkout and base ref are visible. No public interface or write API is exposed.

Each collaborator runs their own server using their own Git credentials. Run `git ls-remote origin` once outside the server to fix authentication if needed; background Git reads do not prompt interactively. Offline ledger reads fall back to local file state with a stale banner; timeout/invalid-file failures retain the last valid board until recovery. The local server automatically retries; the browser also reconnects if the server restarts. The last-success timestamp means a successful data refresh, not that GitHub PRs have been reconciled into ticket status.

Definitions are local to the selected checkout. Update develop normally to receive newly merged tickets; unmerged definitions only appear in a checkout that contains them. The server never pulls, merges, claims, changes status, or writes tracked files. Existing claim/status CLI checks still prevent competing claims even before the next browser update.

VS Code: approve **Ticket dashboard (local)** on folder open, or use **Tasks: Run Task**. Disable automatic startup through **Tasks: Manage Automatic Tasks in Folder**. Workspace trust/automatic-task consent remain the user's choice; no global editor settings are changed. Install dependencies first (`pnpm install`). If another checkout already uses 4173, open its board or start manually with `pnpm t:dashboard --port 4174`. Stop with Ctrl+C or terminate the VS Code task.

`pnpm t:dashboard:snapshot` retains the self-contained export at `artifacts/tickets/index.html`. It is explicitly labelled a snapshot and has no automatic network refresh. Both interfaces include internal ticket text and must not be publicly hosted. Server endpoints accept same-origin loopback GETs only. All generated files remain ignored; tracked BOARD/ROADMAP entry points and per-ticket handoffs retain the conflict-reduction workflow.

## Historical stacked PR completion

New PRs still target `develop`. Completion checks fetch `origin/develop`, resolve its exact commit, and require the merged PR’s merge commit to be an ancestor of that snapshot. This also supports historical PRs merged through stacked branches. Acceptance criteria are read from the ticket file at the same fetched commit; local checkboxes and stale tracking refs cannot substitute. Missing merge history, ticket content or a failed fetch prevents completion. Owner and lifecycle checks still apply.
