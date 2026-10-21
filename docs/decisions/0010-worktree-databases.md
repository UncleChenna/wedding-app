# 0010 — A complete local Supabase stack per managed worktree

- Status: Accepted · 2026-10-21

**Context.** Parallel seed/reset operations must never alter another task's data. A separate public schema alone would not isolate Supabase Auth and Realtime or the existing unqualified Drizzle schema.

**Decision.** Generate a unique project ID and a free 20-port block per worktree. Store generated CLI config under ignored `.harness/supabase-project/`; invoke the CLI with explicit `--workdir`. Copy local env without displaying it, replacing stack URLs/keys and app port. Reset verifies URL identity and uses `--local`.

**Consequences.** More Docker memory and startup time, but no application query changes and full stack isolation. Shared checkout metadata serializes allocations. Failed setup is resumable. Removal explicitly deletes only disposable task volumes, refuses dirty/unmerged source, and retains Git branches. Raw unmanaged worktrees cannot run database wrappers.
