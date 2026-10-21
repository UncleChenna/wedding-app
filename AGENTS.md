<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Shared rules for humans, Codex, Claude Code, Cursor, Copilot and Gemini.
Start with [collaboration](docs/collaboration.md), [learnings](docs/learnings.md), and the newest [handoff](docs/progress.md).

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
- `docs/`: [architecture](docs/architecture.md), [decisions](docs/decisions/README.md), [tasks](docs/tasks.json), [plans](docs/plans/README.md).

## Commands

| Command                                                        | Purpose                                                    |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm install`                                                 | Install dependencies and Husky hooks                       |
| `pnpm agents:link` / `agents:check`                            | Refresh/check shared skill links (copy fallback)           |
| `pnpm dev` / `build` / `start`                                 | Develop/build/serve; managed worktrees get unique ports    |
| `pnpm verify`                                                  | Format → lint → types → unit tests → build → browser smoke |
| `pnpm verify:quick`                                            | Lint, types, related unit tests                            |
| `pnpm lint` / `lint:fix`                                       | ESLint, zero warnings                                      |
| `pnpm format` / `format:check`                                 | Prettier                                                   |
| `pnpm typecheck`                                               | Route type generation and TypeScript                       |
| `pnpm test` / `test:watch`                                     | Unit tests                                                 |
| `pnpm test:e2e` / `test:e2e:smoke`                             | Browser flows (build first)                                |
| `pnpm screenshots`                                             | Playwright routes × themes × 375/768/1280                  |
| `pnpm db:start` / `db:stop` / `db:status`                      | This checkout's local Supabase stack                       |
| `pnpm db:generate` / `db:migrate`                              | Generate/apply Drizzle migrations                          |
| `pnpm db:seed` / `db:reset`                                    | Disposable local data only; reset checks stack identity    |
| `pnpm themes:schema`                                           | Generate theme JSON schema                                 |
| `pnpm task:next [module]` / `task:show [id]`                   | Read the shared queue                                      |
| `pnpm task:claim <id>` / `task:release <id>`                   | Atomic ownership change and metadata commit                |
| `pnpm task:sync`                                               | Refresh local task metadata from the ledger                |
| `pnpm wt:new <id>` / `wt:list` / `wt:remove <id>` / `wt:prune` | Managed isolated worktrees                                 |
| `pnpm task:pr <id>` / `task:finish <id>`                       | Verify/open PR; mark merged work done                      |
| `pnpm agent:loop --help`                                       | Claim → worktree → Claude → verify → PR                    |
| `pnpm plugin:build` / `plugin:install`                         | Package/install shared Claude setup                        |

## Non-negotiable rules

- One editing agent per worktree; claim before work. Never commit/push directly to main.
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
- Conventional Commits; stage only task files. See [engineering conventions](docs/engineering.md).

## Frontend work

Any UI change must follow [design principles](docs/design-principles.md) and pass
[the UI checklist](docs/ui-checklist.md) before it counts as done. Report every result
with evidence. Nested `src/AGENTS.md` summarises frontend rules.

## Workflow and definition of done

1. Read task acceptance, ownership, docs and relevant skill; claim and create a worktree.
2. Read installed Next.js guides before framework code. Write a short dated plan.
3. Write/run failing behavioural tests, then implement; docs-only work uses documentation checks.
4. Run `pnpm verify:quick`, then `pnpm verify`; UI work also passes its checklist in every theme.
5. Update docs/ADRs and prepend a handoff without rewriting old log entries.
6. Commit task files, open a PR with evidence, set in_review; the other person reviews.
7. After merge, mark done and remove the disposable worktree. Never mark failing/unverified work done.

If blocked, retain the claim, record `blocked_reason` and the next action, and hand off.
If you make the same mistake twice, propose a concrete harness fix (hook, skill or doc line)
in your summary; add a verified fix to [learnings](docs/learnings.md).

## Skills

Read the matching `.agents/skills/<name>/SKILL.md`:
`implement-task`, `ui-review`, `new-theme`, `db-migration`, `handoff`, `release-checklist`.
Long rehearsal details live inside the skill's `references/` folder.
