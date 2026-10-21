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
| `pnpm agent:loop --help`      | Run Claude Code headless over `docs/tasks.json`                                                              |

The full list is in [AGENTS.md](AGENTS.md#commands).

## Themes

Change the active theme in `src/modules/theming/config.ts`. Add a theme in under five minutes: [docs/theming.md](docs/theming.md).

## Docs

- [AGENTS.md](AGENTS.md): conventions, folder rules, definition of done, and the workflow loop (for humans and AI agents)
- [docs/architecture.md](docs/architecture.md) and [docs/decisions/](docs/decisions/)
- [docs/tasks.json](docs/tasks.json) and [docs/progress.md](docs/progress.md): task queue and work log

## Working with AI agents

`AGENTS.md` is read natively by Codex and pointed to from `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` and `.cursor/rules/`. For Claude Code:

- Commands: `/plan`, `/implement <task-id>`, `/verify`, `/review`
- Subagents: `code-reviewer`, `test-writer`, `ui-reviewer`
- Hooks: Prettier + ESLint after every edit; `pnpm verify:quick` before the agent stops
- MCP: Playwright browser (`.mcp.json`; approve it the first time Claude Code asks)
- Unattended: `pnpm agent:loop --max-iterations 3` runs `/implement` on the next pending tasks, one commit each, stopping at the first failure. Logs go to `logs/agent-loop/`.
