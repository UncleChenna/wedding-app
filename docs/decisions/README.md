# Architecture decision records

Short records of decisions that are expensive to reverse. Add one per new decision: copy [the template](template.md), next number, status `Accepted`.

| #                                       | Decision                                                              |
| --------------------------------------- | --------------------------------------------------------------------- |
| [0001](0001-nextjs-app-router.md)       | Next.js App Router with Cache Components                              |
| [0002](0002-supabase.md)                | Supabase for Postgres, Auth and Realtime, run locally with the CLI    |
| [0003](0003-drizzle-migrations.md)      | Drizzle ORM owns schema and migrations                                |
| [0004](0004-theming-css-variables.md)   | Themes as JSON → CSS variables → Tailwind tokens, with a WCAG AA gate |
| [0005](0005-feature-modules.md)         | Code organised by feature module                                      |
| [0006](0006-security-headers.md)        | Static CSP with 'unsafe-inline' instead of nonces                     |
| [0007](0007-testing-and-verify-gate.md) | Vitest + Playwright, one `pnpm verify` gate                           |
| [0008](0008-agent-harness.md)           | AGENTS.md as the single source of truth for AI agents                 |
| [0009](0009-portable-skills.md)         | Portable skills and generated Claude distribution                     |
| [0010](0010-worktree-databases.md)      | Isolated Supabase stack per worktree                                  |
| [0011](0011-atomic-task-claims.md)      | Atomic Git remote task claims                                         |
| [0012](0012-shared-quality-hooks.md)    | Shared hooks and independent quality gates                            |
| [0013](0013-ticket-system.md)           | In-repo tickets with a shared claim ledger                            |
