<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Shared rules for humans, Codex, Claude Code, Cursor, Copilot and Gemini.
Start with [collaboration](docs/collaboration.md), [learnings](docs/learnings.md), and the relevant [handoff](docs/handoffs/README.md).

## Project

Mobile-first wedding website for 200–300 guests: personal invitations/RSVP,
offline QR check-in, free table ordering, kitchen/bar boards, and admin.
Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Supabase,
Drizzle, Zod, Vitest, Playwright, pnpm 12, Node 24. Product: [PRD](docs/prd.md).

## Module map

- `src/app/`: routes/layouts/metadata only; guest, staff and admin route groups.
- `src/modules/{invitations,checkin,ordering,admin}/`: feature components, server I/O, pure lib and tests.
- `src/modules/shared/`: base UI, env, logging, Supabase clients and Drizzle schema/client.
- `src/modules/theming/`: theme JSON, validation, CSS variables; `/dev/theme` showcases components.
- `drizzle/`: generated migrations. `supabase/`: local-stack template.
- `scripts/`: database, verification and collaboration tools.
- `.agents/skills/`: canonical portable workflows; Claude links here; Codex/Cursor read directly.
- `docs/`: [architecture](docs/architecture.md), [decisions](docs/decisions/README.md), [tickets](docs/tickets.md) ([board](tickets/BOARD.md), [roadmap](tickets/ROADMAP.md)), [current state](docs/current-state.md), [plans](docs/plans/README.md).

## Commands

| Command                                                              | Purpose                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm install`                                                       | Install dependencies and Husky hooks                        |
| `pnpm agents:link` / `agents:check`                                  | Refresh/check shared skill links (copy fallback)            |
| `pnpm dev` / `build` / `start`                                       | Develop/build/serve; managed worktrees get unique ports     |
| `pnpm verify`                                                        | Format → lint → types → unit tests → build → browser smoke  |
| `pnpm verify:quick`                                                  | Lint, types, related unit tests                             |
| `pnpm lint` / `lint:fix`                                             | ESLint, zero warnings                                       |
| `pnpm format` / `format:check`                                       | Prettier                                                    |
| `pnpm typecheck`                                                     | Route type generation and TypeScript                        |
| `pnpm test` / `test:watch`                                           | Unit tests                                                  |
| `pnpm test:e2e` / `test:e2e:smoke`                                   | Browser flows (build first)                                 |
| `pnpm screenshots`                                                   | Playwright routes × themes × 375/768/1280                   |
| `pnpm db:start` / `db:stop` / `db:status`                            | This checkout's local Supabase stack                        |
| `pnpm db:generate` / `db:migrate`                                    | Generate/apply Drizzle migrations                           |
| `pnpm db:seed` / `db:reset`                                          | Disposable local data only; reset checks stack identity     |
| `pnpm themes:schema`                                                 | Generate theme JSON schema                                  |
| `pnpm t:next [--module m]` / `t:board` / `t:list` / `t:show <id>`    | Read the queue (live, includes unmerged claims)             |
| `pnpm t:claim <id> --owner <you> --agent <agent>` / `t:release <id>` | Atomic claim via the shared ticket ledger                   |
| `pnpm t:move <id> <status> [--reason] [--push]`                      | Enforced status transition                                  |
| `pnpm t:pr <id>`                                                     | Verify, push, open PR, move to in_review                    |
| `pnpm t:new` / `t:validate` / `t:render` / `t:sync`                  | Scaffold, validate, render local snapshots, sync own ticket |
| `pnpm wt:new <id>` / `wt:list` / `wt:remove <id>` / `wt:prune`       | Managed isolated worktrees                                  |
| `pnpm agent:loop --help`                                             | Next → claim → worktree → Claude → t:pr                     |
| `pnpm plugin:build` / `plugin:install`                               | Package/install shared Claude setup                         |

## Non-negotiable rules

- One editing agent per worktree; claim a ticket before work. Never commit/push directly to main or develop.
- Keep changes within the task; preserve other people's uncommitted work.
- TypeScript strict: no `any`, `@ts-ignore`, or unexplained non-null assertions.
- Kebab-case files, PascalCase components, named exports except Next-required defaults.
- Routes call modules. Modules never import app code or another feature's server internals.
- Server I/O imports `server-only`; validate external input with Zod. Use Drizzle for data.
- Supabase JS is for Auth/Realtime. Keep RLS enabled; policy changes need authorization and an ADR.
- Expected errors are return values. Use the shared logger; never expose secrets or guest technical errors.
- No manual edits to secrets, lockfiles, installed/build output, applied migrations or generated schemas.
  Use approved generators; explicit human exceptions use the exact-path process in collaboration docs.
- Ask before paid/new account services, native-build dependencies, CI/RLS changes or data deletion,
  unless the current user request already authorizes the specific action.
- Never weaken/skip/delete tests, lint rules or hooks to get green.
- Ticket commits start `TICKET-NNN: `; other commits use Conventional Commits. Stage only ticket files.
  No AI attribution (see below). See [engineering conventions](docs/engineering.md).

## Frontend work

Any UI change must follow [design principles](docs/design-principles.md) and pass
[the UI checklist](docs/ui-checklist.md) before it counts as done. Report every result
with evidence. Nested `src/AGENTS.md` summarises frontend rules.

## Ticket workflow (every agent, every time)

All work happens on a claimed ticket in [`tickets/`](tickets/BOARD.md). Rules: [docs/tickets.md](docs/tickets.md).
Exact commands: the [`ticket-workflow` skill](.agents/skills/ticket-workflow/SKILL.md).

### Traceable branches and human review

- Keep the ticket ID in its filename (`tickets/TICKET-NNN-description.md`), commit subjects and PR title.
  Name every new work branch **exactly** after its ticket ID: `TICKET-188`, with no owner prefix or extra slug.
- Push commits to `origin/<ticket-id>` at the start and throughout the task. Before handing off, push all work
  and open a PR targeting **`develop`**; unfinished work uses a draft PR with remaining work listed.
- One ticket per branch/PR. Link the ticket and record the PR URL in its metadata through the CLI. No untracked
  side tasks or local-only finished work; create a ticket for additional scope before implementing it.
- PR descriptions must explain the problem and result, concrete changes, acceptance criteria with evidence,
  tests run and their actual results, untested cases, risks/limitations, and any migration or rollback steps.
  Include screenshots for UI changes and exact review steps where useful. Empty templates and vague summaries
  such as "done" are not sufficient. Update the description when the implementation changes.
- The human reviews and merges. Agents must **never merge, enable auto-merge, or push directly to `develop` or
  `main`**. Keep the ticket `in_review` until its PR is confirmed merged into `develop`, then mark it `done`.
- Existing active branches retain their names during migration; do not rename another owner's branch or merge
  their work. New claims and branches follow the exact-ID rule.

### Mandatory check before coding

Before writing or changing code, review the task list to confirm you are working on the right thing:

- Run `pnpm t:board` and `pnpm t:next` for live status and ownership; read `tickets/ROADMAP.md` for build order.
- Read the intended ticket with `pnpm t:show <id>`, including its acceptance criteria, test plan, blockers and
  related tickets. Check the relevant PRD section and relevant `docs/handoffs/<ticket-id>.md` handoff.
- Confirm the planned changes match the user's current request and ticket scope, prerequisites are complete,
  and no other owner is already doing the same work. An explicit user-assigned task takes precedence over the
  automatic next suggestion, but does not make unfinished dependencies complete.
- Before coding, briefly state the ticket ID, intended outcome and verification plan. Resolve scope or dependency
  discrepancies first; do not start unrelated, duplicate or blocked work.
- Repeat this check after a scope change or handoff, and compare the result against the acceptance criteria
  before declaring the work finished.

1. **Pick the work.** `pnpm t:next`, then `pnpm t:claim <id> --owner <you> --agent <agent>`. Never work without a
   claimed ticket; one ticket at a time.
2. **Isolate it.** `pnpm wt:new <id>`; work only in `.worktrees/<id>` on its branch named exactly after the ticket ID, e.g. `TICKET-188`.
3. **Start.** `pnpm t:move <id> in_progress --push`, so the change is committed and pushed immediately.
4. **Build.** Dated plan, failing tests, implementation, `pnpm verify`. Commit in small steps; every subject starts
   with the ticket id, e.g. `TICKET-014: add RSVP form validation`.
5. **Finish.** Tick the acceptance criteria, fill in the notes, write the PR body, then `pnpm t:pr <id>`. It verifies,
   pushes, opens a PR titled `<id>: <title>` targeting `develop` from the template, moves the ticket to `in_review` and pushes.
6. **Close.** After the human reviews and merges into `develop`: `pnpm t:move <id> done` (records completion date and PR link), then `pnpm wt:remove <id>`.
   The ticket file and boards catch up on your next ticket branch (`t:move … in_progress` syncs them).
7. **Blocked?** `pnpm t:move <id> blocked --reason "…" --push`, then pick another ticket. Never silently skip anything.
8. **Hand off.** Write or update your ticket’s file in [docs/handoffs/](docs/handoffs/README.md) before ending any session.

Never leave finished work unpushed. Never mark a ticket done with failing checks or unticked criteria. Never edit
another owner's in-progress ticket. UI work also passes [the UI checklist](docs/ui-checklist.md) in every theme. Update
docs/ADRs with the change. If you make the same mistake twice, propose a concrete harness fix (hook, skill or doc
line) in your summary and add a verified fix to [learnings](docs/learnings.md).

## No AI attribution

Commits, PR titles, PR bodies and comments never credit an AI agent: no `Co-Authored-By` trailers for Claude, Codex or
any bot, no "Generated with…" lines, no robot emoji signatures. Claude Code (`attribution` in
`.claude/settings.json`) and Codex (`commit_attribution` in `.codex/config.toml`) are configured not to add them. The
`commit-msg` hook rejects them, and the CI `pr-text` job fails a PR whose title or body contains them. If your agent
adds one anyway, remove it before committing.

## Skills

Read the matching `.agents/skills/<name>/SKILL.md`:
`ticket-workflow`, `implement-task`, `ui-review`, `new-theme`, `db-migration`, `handoff`, `release-checklist`.
Long rehearsal details live inside the skill's `references/` folder.

## Avoid shared-file conflicts

- `pnpm t:dashboard` serves a read-only, auto-refreshing loopback board at http://127.0.0.1:4173. Each collaborator uses their own Git access. `pnpm t:dashboard:snapshot` exports an offline HTML file.
- `tickets/BOARD.md` and `tickets/ROADMAP.md` are stable links. Never commit generated board rows; `pnpm t:render` writes ignored artifacts only.
- Status/ownership authority is the shared ledger. Do not sync unrelated ticket files. `pnpm t:sync <id>` operates only on that ticket’s branch.
- Handoffs go in `docs/handoffs/<ticket-id>.md`; preserve `docs/progress.md` as history.
- Start new feature branches from freshly fetched `origin/develop`. For a new ticket not yet present there, carry only its definition, never unrelated feature commits. Existing branches need an explicit base update.
- Shared implementation edits can still conflict. Inspect overlapping files, integrate PRs sequentially, and report the exact develop commit used for verification. Never auto-merge.
