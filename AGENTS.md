<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Rules for every agent and human. Keep it simple: pick a ticket, write the code, open a PR.

## Project

Mobile-first wedding website for 200–300 guests: personal invitations/RSVP,
offline QR check-in, free table ordering, kitchen/bar boards, and admin.
Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Supabase,
Drizzle, Zod, Vitest, Playwright, pnpm 12, Node 24. Product: [PRD](docs/prd.md).
Routes and owners: [journeys](docs/journeys.md). Background: [architecture](docs/architecture.md),
[decisions](docs/decisions/README.md).

## Module map

- `src/app/`: routes/layouts/metadata only; guest, staff and admin route groups.
- `src/modules/{invitations,checkin,ordering,admin}/`: feature components, server I/O, pure lib and tests.
- `src/modules/shared/`: base UI, env, logging, Supabase clients and Drizzle schema/client.
- `src/modules/theming/`: theme JSON, validation, CSS variables; `/dev/theme` showcases components.
- `drizzle/`: generated migrations. `supabase/`: local-stack template. `scripts/`: database and dev tools.
- `tickets/`: the backlog, one Markdown file per ticket.

## Workflow

1. Pick a ticket in `tickets/` whose `status:` is `todo` and whose `blocked_by` tickets are `done`.
2. Branch from fresh `origin/develop`, named after the ticket: `TICKET-123`. Optional isolated checkout with
   its own database and ports: `pnpm wt:new TICKET-123` (work in `.worktrees/TICKET-123`).
3. Set the ticket's `status:` to `in_progress` (and `owner:`) in the ticket file. That's the whole claim.
4. Write the code and tests. Run `pnpm verify:quick` while working and `pnpm verify` before the PR.
5. Set `status: in_review`, push, and open a PR to `develop` titled `TICKET-123: <title>` with
   `gh pr create --base develop`. Fill in the short PR template. Then stop: the owner reviews and merges.
6. Need extra scope? Add a new ticket file (copy `tickets/TEMPLATE.md`) rather than growing the PR.

Never merge PRs, enable auto-merge, or push to `develop` or `main`.

## Commands

| Command                                           | Purpose                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| `pnpm dev` / `build` / `start`                    | Develop/build/serve                              |
| `pnpm verify`                                     | Format → lint → types → unit tests → build       |
| `pnpm verify:quick`                               | Lint, types, unit tests related to your changes  |
| `pnpm lint` / `format` / `typecheck`              | Individual checks                                |
| `pnpm test` / `test:e2e`                          | Unit tests / browser flows (build first)         |
| `pnpm screenshots`                                | Playwright screenshots, all themes, 375/768/1280 |
| `pnpm db:start` / `db:stop` / `db:status`         | This checkout's local Supabase stack             |
| `pnpm db:generate` / `db:migrate`                 | Generate/apply Drizzle migrations                |
| `pnpm db:seed` / `db:reset`                       | Disposable local data only                       |
| `pnpm wt:new <id>` / `wt:list` / `wt:remove <id>` | Isolated worktree with its own DB and ports      |

CI runs lint, typecheck and unit tests on every PR. Run browser tests (`pnpm test:e2e`) and screenshots
locally when you change UI or a guest flow.

## Code rules

- TypeScript strict: no `any`, `@ts-ignore`, or unexplained non-null assertions.
- Kebab-case files, PascalCase components, named exports except Next-required defaults.
- Routes call modules. Modules never import app code or another feature's server internals.
- Server I/O imports `server-only`; validate external input with Zod. Use Drizzle for data.
- Supabase JS is for Auth/Realtime. Keep RLS enabled on every table.
- Expected errors are return values. Use the shared logger; never show guests technical errors.
- Schema changes: edit `schema.ts`, then `pnpm db:generate`. Never edit a migration already on `develop`.
- Don't hand-edit secrets, lockfiles or generated output. Don't weaken or delete tests to get green.
- Commits: `TICKET-123: what changed` on ticket branches, Conventional Commits otherwise.

## UI

Follow [design principles](docs/design-principles.md) and run through [the UI checklist](docs/ui-checklist.md).
Use theme tokens and the shared components in `src/modules/shared/components/ui`.

## Ask the owner first

Paid or new external services, new native-build dependencies, RLS policy changes, deleting real data,
and destructive migrations (drop, rename, retype).

## No AI attribution

Commits, PR titles, PR bodies and comments never credit an AI agent: no `Co-Authored-By` trailers for AI
tools, no "Generated with…" lines, no robot emoji. The `commit-msg` hook and the PR text check reject them.
