# 0023 — Neon branches for worktree databases

- Status: Proposed · 2026-11-04 · would supersede [0010](0010-worktree-databases.md)

**Context.** ADR 0010 gives every managed worktree a complete local Supabase stack in Docker: Postgres, Auth, Realtime,
Storage and Studio, about nine containers each. In practice, five to seven open worktrees exhaust Docker's memory:
stacks fail health checks, Postgres connections time out, and agents have had to delete worktrees or start trimmed
stacks to run database tests. The owner doesn't want Docker. What tests actually need from each worktree is an
isolated Postgres. Auth is used only by the admin sign-in flows (email codes and TOTP); Realtime isn't used yet; CI
already runs plain `postgres:17`.

**Decision (proposed).**

1. **One Neon development project; one branch per managed worktree.** `wt:new` creates branch `wt-<ticket-id>` from
   the project's seeded base branch through the Neon API, and writes its pooled and direct connection strings to the
   worktree's ignored `.env.local`. `wt:remove` deletes the branch. Branches are copy-on-write, so creation is instant
   and idle branches cost almost nothing.
2. **Safety guard.** `assertDatabaseTarget` no longer means "localhost". It means "the branch recorded for this
   worktree". The branch id is stored in `.harness/worktree.json`, and the URL's endpoint must match it. The default
   branch, the base branch, any production host, and other worktrees' branches are refused for migrate, seed, reset and
   opt-in tests. `db:reset` resets the branch to its parent rather than dropping data elsewhere.
3. **Auth for admin tests.** A hosted Supabase development project, free tier, supplies Auth. Its keys go in each
   worktree's `.env.local` like today. Tests that need it stay opt-in.
4. **Credentials.** The Neon API key lives only in the developer's shell environment or keychain, never in the
   repository, logs or tool output. Connection strings are written without being printed.
5. **Fallback.** The Docker path stays behind an explicit flag for one release, then is removed.

Rejected:

- **Keep Docker with trimmed stacks:** less load, but still fragile and unwanted.
- **One shared database with a schema per worktree:** unqualified Drizzle tables and global settings rows collide
  between worktrees.
- **Supabase branching:** paid, and slower to create.
- **DBeaver:** it's a database client, not a database.

**Consequences.**

- Database tests need internet access and a Neon account.
- Queries cross the network, so they're slower than localhost, but still fine for tests.
- No Docker memory pressure, and parallel worktrees stop interfering.
- Realtime board design (TICKET-033) can't rely on a local Supabase Realtime.
- The production host is a separate decision (TICKET-144). Neon in development with Supabase in production is
  workable, since both run Postgres 17.
- To reverse, re-enable the Docker flag.

**Validation.**

- Pending implementation (TICKET-213): guard unit tests; two parallel worktrees migrating, seeding and testing
  independently; removal deleting only its branch; one full run on a machine with Docker stopped.
