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
pnpm db:seed       # resets local fake data (110 invitations, 249 guests)
pnpm db:seed --profile load # 350 named guests seated across 30 tables
pnpm dev           # http://localhost:3000
```

The first `pnpm db:start` downloads the Supabase Docker images, which takes a few minutes.

Useful URLs:

- App: http://localhost:3000 · theme preview: http://localhost:3000/dev/theme
- Supabase Studio: http://localhost:54323 · local email inbox: http://localhost:54324

Stop the database with `pnpm db:stop`.

### Local sign-in shortcut

On a local setup, the code `000000` works everywhere a code is asked for: the admin email code, the
admin authenticator code and every staff PIN (`/checkin`, `/kitchen`, `/bar`, `/host`). Your email
still has to be on `ADMIN_EMAIL_ALLOWLIST`. It only works when the database and Supabase are on this
machine and the browser is on `localhost`, and never on Vercel. Set `LOCAL_SIGN_IN_CODE=off` in
`.env.local` to turn it off, or to six other digits to change it.

## Commands

| Command                       | Purpose                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm verify`                 | Format check, lint, typecheck, unit tests, build. CI runs lint, typecheck and unit tests. |
| `pnpm verify:quick`           | Lint, typecheck, and the unit tests related to changed files                              |
| `pnpm test` / `pnpm test:e2e` | Unit tests / all e2e tests (run `pnpm build` before e2e)                                  |
| `pnpm screenshots`            | Screenshots of pages in every theme at 375/768/1280px → `artifacts/screenshots/`          |
| `pnpm db:generate`            | Generate a migration after editing `src/modules/shared/server/db/schema.ts`               |
| `pnpm db:reset`               | Recreate, migrate and reseed the local DB                                                 |

The full list is in [AGENTS.md](AGENTS.md#commands).

## Themes

Change the active theme in `src/modules/theming/config.ts`. Add a theme in under five minutes: [docs/theming.md](docs/theming.md).

## Docs

- [AGENTS.md](AGENTS.md): conventions and the simple ticket → branch → PR workflow (for humans and AI agents)
- [docs/architecture.md](docs/architecture.md) and [docs/decisions/](docs/decisions/)
- [tickets/](tickets/): the backlog, one file per ticket with a `status:` line
- [docs/current-state.md](docs/current-state.md): what exists and what is incomplete
