# TICKET-012 handoff

## 2026-10-31 — divine / codex / TICKET-012

Base f7e8fac048514058030d28d7b3a61f168de014f9. Worktree .worktrees/TICKET-012; isolated project wedding-4064897a35a1, DB29681, app29690. Active theme pair reader, internal activation service, server layouts and additive dark-theme column implemented as an unfinished checkpoint. No public activation endpoint. Existing active_theme_id is the light slot.

Verified: new suite first failed missing implementation; 23 unit tests passed, quick lint/types/related tests passed. Migration applied twice: all12 table counts zero and applied migration count5 both times; all12 RLS enabled. Seven opt-in database tests passed including pair persistence, preservation of venue and blank dark-theme rejection. First DB test failed because postgres-js transaction clients cannot be passed directly to drizzle; using Drizzle's own transaction fixes the test.

Pending: exact-path approval for generated SQL0004, snapshot0004, journal (local only, not committed); seed settings update/tests; actual cache invalidation and outage browser tests; full build/verify; all-theme UI evidence; documentation/acceptance refinement. No acceptance criteria marked done. Migration source schema is checkpointed but artifacts are deliberately pending approval, so this draft branch must not merge yet. If develop adds another migration, regenerate against the new base before approval/merge. No remote or populated database touched.

Next: await migration approval, finish verification. TICKET-030 physical QA deferral and TICKET-040 cache deletion were explicitly approved on31October; resume those isolated tasks while this waits. Handoff skill used. Avoid shell redirection to /dev/null: repository hook treats it as an outside-checkout edit.
