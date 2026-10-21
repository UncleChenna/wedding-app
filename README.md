# Wedding website

Mobile-first wedding site: personal invitations with QR codes and RSVP, offline gate check-in, table ordering with a live kitchen/bar board, and an admin area. Built with Next.js 16, Supabase, Drizzle, and Tailwind CSS 4, with plug-and-play colour themes.

> Status: foundation only. Product features land once `docs/prd.md` is written.

## Prerequisites

- Node.js 24 (`.nvmrc`)
- pnpm 12 — run `corepack enable pnpm` (the version is pinned in `package.json`)
- Docker Desktop, running (for the local Supabase stack)

## Quick start (clean clone)

```bash
pnpm install       # deps + git hooks
pnpm db:start      # starts local Supabase in Docker; creates .env.local if missing
pnpm db:migrate    # applies Drizzle migrations
pnpm db:seed       # resets and seeds fake data (110 invitations, 245 guests)
pnpm dev           # http://localhost:3000
```

The first `pnpm db:start` downloads the Supabase Docker images, which takes a few minutes.

Useful URLs:

- App: http://localhost:3000 · theme preview: http://localhost:3000/dev/theme
- Supabase Studio: http://localhost:54323 · local email inbox: http://localhost:54324

Stop the database with `pnpm db:stop`.

## Commands

| Command                       | Purpose                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm verify`                 | The full gate: format check, lint, typecheck, unit tests, build, Playwright smoke. CI runs the same command. |
| `pnpm verify:quick`           | Lint, typecheck, and the unit tests related to changed files                                                 |
| `pnpm test` / `pnpm test:e2e` | Unit tests / all e2e tests (run `pnpm build` before e2e)                                                     |
| `pnpm screenshots`            | Screenshots of pages in every theme at 375/768/1280px → `artifacts/screenshots/`                             |
| `pnpm db:generate`            | Generate a migration after editing `src/modules/shared/server/db/schema.ts`                                  |
| `pnpm db:reset`               | Recreate, migrate and reseed the local DB                                                                    |
| `pnpm agent:loop --help`      | Run Claude Code headless over the ticket queue (`pnpm t:next`)                                               |

The full list is in [AGENTS.md](AGENTS.md#commands).

## Themes

Change the active theme in `src/modules/theming/config.ts`. Add a theme in under five minutes: [docs/theming.md](docs/theming.md).

## Docs

- [AGENTS.md](AGENTS.md): conventions, folder rules, definition of done, and the workflow loop (for humans and AI agents)
- [docs/architecture.md](docs/architecture.md) and [docs/decisions/](docs/decisions/)
- [tickets/BOARD.md](tickets/BOARD.md), [tickets/ROADMAP.md](tickets/ROADMAP.md) and [docs/tickets.md](docs/tickets.md): the ticket backlog and its rules (`pnpm t:*`)
- [docs/current-state.md](docs/current-state.md): what exists, what is incomplete, PRD contradictions and assumptions
- [docs/handoffs/](docs/handoffs/README.md): per-ticket handoffs; [docs/progress.md](docs/progress.md) retains historical work

## Working together with AI agents

Start with [docs/collaboration.md](docs/collaboration.md): onboarding, atomic task claims,
isolated worktrees/databases, skills, hooks, PR reviews and optional Claude plugin.
Run `pnpm agents:link` after cloning or changing skills. Canonical workflows live in
`.agents/skills/`; `AGENTS.md` is the shared index. Use `/implement-task` in Claude.

`pnpm agent:loop` claims work, creates an isolated checkout, runs Claude, verifies,
and opens a PR. It stops on failure and retains the claim for a handoff.

## Visual ticket board

Run `pnpm t:dashboard` once and open http://127.0.0.1:4173. The local read-only server watches ticket files and checks the shared ledger every 20 seconds. The browser updates without losing filters, theme or open ticket details. Connection state and last successful refresh are visible. Stop with Ctrl+C; use `pnpm t:dashboard --port 4174` for another checkout.

VS Code can start it when this folder opens: approve **Ticket dashboard (local)** when prompted to allow automatic tasks (in a trusted workspace). Otherwise use **Tasks: Run Task**. Disable it through **Tasks: Manage Automatic Tasks in Folder**. Each collaborator needs dependencies installed and their own working Git authentication; nothing is hosted or shared over the network.

Ticket definitions come from the selected checkout, including local edits. Pull merged definitions normally; the dashboard never pulls or merges your branch. Shared claims/status refresh from the ledger automatically. `pnpm t:dashboard:snapshot` still exports a standalone HTML snapshot to `artifacts/tickets/index.html`.
