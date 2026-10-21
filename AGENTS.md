<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Single source of truth for every AI agent (Claude Code, Codex, Cursor, Copilot, Gemini) and human working here. Keep it short and factual.

## Project

A mobile-first wedding website for 200–300 guests: **invitations** (personal link + QR, RSVP, tag-alongs), **gate check-in** (camera QR scan, works offline), **table ordering** (free food/drinks, live kitchen/bar board), **admin** (guests, seating, menu, live dashboard). Premium look, fully responsive, plug-and-play colour themes. Product spec: `docs/prd.md`.

Stack: Next.js 16 App Router (Cache Components on) · React 19 · TypeScript strict · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime; local via CLI) · Drizzle ORM · Zod 4 · Vitest · Playwright · pnpm 12 · Node 24.

## Architecture map

```
src/
  app/                    Routes and layouts ONLY. Thin: call into modules.
    (guest)/              /, /invite, /order
    (staff)/              /checkin, /kitchen
    (admin)/              /admin
    dev/theme/            Every component in every theme
    layout.tsx            Applies active theme as CSS vars on <html> (server-rendered)
    error.tsx, global-error.tsx, not-found.tsx
  instrumentation.ts      Validates env at server start (fail fast)
  modules/
    invitations/ checkin/ ordering/ admin/ theming/ shared/
      components/         React components for this feature
      server/             Data access + Server Actions ("server-only")
      lib/                Pure logic, types, validation (no I/O)
      __tests__/          Vitest unit tests (*.test.ts[x])
    shared/server/db/     Drizzle schema.ts + client.ts (all tables)
    shared/components/ui/ Base components: Button, Card, Input, Sheet, Toast
    theming/themes/*.json Themes; theming/config.ts = active theme
drizzle/                  Generated SQL migrations (never hand-edit applied ones)
scripts/                  seed, db-start, verify-quick, agent-loop
e2e/                      Playwright (smoke.spec.ts tagged @smoke; visual/ screenshots)
supabase/config.toml      Local Supabase stack
docs/                     architecture, decisions (ADRs), theming, tasks.json, progress.md, plans/
```

Details: `docs/architecture.md`. Decisions: `docs/decisions/`.

## Commands

| Command                                   | What it does                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm install`                            | Install deps (Husky hooks install via `prepare`)                                                     |
| `pnpm dev`                                | Dev server on :3000                                                                                  |
| `pnpm build` / `pnpm start`               | Production build / serve                                                                             |
| `pnpm verify`                             | **The gate.** format:check → lint → typecheck → test → build → e2e smoke                             |
| `pnpm verify:quick`                       | lint → typecheck → unit tests related to changed files                                               |
| `pnpm lint` / `pnpm lint:fix`             | ESLint (0 warnings allowed)                                                                          |
| `pnpm format` / `pnpm format:check`       | Prettier                                                                                             |
| `pnpm typecheck`                          | `next typegen` + `tsc --noEmit`                                                                      |
| `pnpm test` / `pnpm test:watch`           | Vitest unit tests                                                                                    |
| `pnpm test:e2e` / `pnpm test:e2e:smoke`   | Playwright at mobile (Pixel 7) + desktop (1280px); needs `pnpm build` first                          |
| `pnpm screenshots`                        | Screenshots of routes × themes × 375/768/1280 → `artifacts/screenshots/` (`SCREENSHOT_ROUTES=/a,/b`) |
| `pnpm db:start` / `db:stop` / `db:status` | Local Supabase (Docker). `db:start` creates `.env.local` if missing                                  |
| `pnpm db:generate`                        | Generate a migration from `schema.ts` changes                                                        |
| `pnpm db:migrate`                         | Apply migrations                                                                                     |
| `pnpm db:seed`                            | Reset + seed local DB with deterministic fake data (refuses non-local DBs)                           |
| `pnpm db:reset`                           | Recreate local DB, migrate, seed                                                                     |
| `pnpm themes:schema`                      | Regenerate `themes/theme.schema.json` after changing the theme Zod schema                            |
| `pnpm agent:loop`                         | Run Claude Code headless on the next pending task (`--help` for flags)                               |

## Conventions

- TypeScript strict; no `any`, no `@ts-ignore`, no non-null `!` in app code without a comment why.
- Files kebab-case (`guest-list.tsx`); components PascalCase; named exports (default exports only where Next requires them).
- Import via `@/modules/...`. Modules never import from `src/app`. Feature modules may import `shared` and `theming`; import another feature module only through what it exports, never its `server/` internals.
- Server-only code imports `"server-only"`. Validate every external input (forms, params, JSON) with Zod in `lib/`.
- Data access: Drizzle via `@/modules/shared/server/db/client`. Supabase JS only for Auth/Realtime. All tables have RLS on with no policies (browser can't touch data directly) — keep it that way unless a feature needs a policy, and document it.
- Expected errors are return values (`{ ok: false, error }`), not throws. Log with `createLogger({ module })` from `shared/lib/logger.ts`, never `console.log`.
- **Styling: tokens only.** Use Tailwind token classes (`bg-primary`, `text-muted-foreground`, `rounded-md`, `shadow-md`, `font-display`). No hex/rgb/hsl literals in `src/` (ESLint enforces); Tailwind's default palette is disabled. New token → `docs/theming.md`.
- Mobile-first: design at 375px, then `sm:`/`md:`/`lg:`. Touch targets ≥ 44px. Every input has a label. WCAG 2.2 AA.
- Tests: unit tests next to the module in `__tests__/`; user flows in `e2e/`. Tag must-never-break flows `@smoke`.
- Commits: Conventional Commits (`feat(ordering): ...`, `fix:`, `test:`, `docs:`, `chore:`), enforced by commitlint.

## Folder rules

- `src/app/**`: routing, layouts, metadata only. No business logic, no DB queries.
- `drizzle/**`: generated. Never edit a migration that has been committed; add a new one.
- `src/modules/theming/themes/theme.schema.json`: generated (`pnpm themes:schema`).
- **Never touch:** `.env*` secrets (read `.env.example` only), `pnpm-lock.yaml` by hand, `supabase/.temp`, `.next/`, `node_modules/`, CI secrets. Never disable lint rules, tests, or hooks to get green.
- Ask the human before: adding a paid service or a new account-requiring service (beyond Supabase and GitHub), adding a dependency with native builds, changing CI, changing RLS, or deleting data.

## Definition of done

1. Acceptance criteria in `docs/tasks.json` (or the request) are met and covered by tests.
2. `pnpm verify` passes locally.
3. UI changes checked at 375/768/1280 in every theme (`pnpm screenshots` or the `ui-reviewer` agent).
4. Docs updated if behaviour, commands, or architecture changed; ADR added for new decisions.
5. `docs/progress.md` has an entry; task status updated in `docs/tasks.json`.
6. One conventional commit per task.

## The loop

1. **Read the task** (`docs/tasks.json` entry or request).
2. **Read the relevant docs** (this file, `docs/architecture.md`, module code, `node_modules/next/dist/docs/` for Next APIs).
3. **Write a short plan** in `docs/plans/YYYY-MM-DD-<task-id>.md`.
4. **Write failing tests** first; run them and see them fail.
5. **Implement** the smallest change that passes.
6. **Run `pnpm verify:quick`**; fix until green.
7. **Run `pnpm verify`**; fix until green.
8. **Update `docs/progress.md`** (append only: done / learned / next) and the task status.
9. **Commit** with a conventional commit message.

Never mark a task done with failing checks. Never weaken, skip, or delete a test to make it pass. If blocked, set the task to `blocked`, write why in `docs/progress.md`, and stop.
