# Project learnings

- Next 16.4 changed error boundaries to `retry` and `error: unknown`; read installed docs before framework changes.
- `next dev` regenerates its managed AGENTS.md block; retain it.
- ESM JSON imports used by Playwright need `with { type: "json" }`.
- pnpm 12 requires build-script approvals in `pnpm-workspace.yaml`; never bypass them.
- Pixel 7 emulation is 412px wide; set 375px explicitly for the mobile design check.
- Turbopack needs local port binding during builds; permission failures require an allowed execution environment, not weakened tests.
- Worktree source is committed Git content, not the primary checkout's dirty files; commit a reviewed foundation before spinning up product worktrees.
- Local task JSON is not a cross-machine lock; claim through the shared Git ledger before editing.
- Supabase project IDs and all host ports must differ per worktree; use the managed scripts, not raw CLI reset.
- Hook exit success must never hide failed formatting or verification; there is no retry-count escape hatch.
- Git directory-only ignore patterns do not match symlinks; ignore `.claude/skills` without a trailing slash.
- Identity fallbacks from environment variables must use `||`, not `??`: an exported empty `AGENT_OWNER` otherwise hides `git config harness.owner`.
- Ticket files are machine-written; change them with `pnpm t:*`, or by hand followed by `pnpm t:render`. Prettier ignores `tickets/`.
