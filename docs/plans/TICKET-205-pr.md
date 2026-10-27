# Ticket

Ticket: TICKET-205

# Summary

A failed managed-stack startup can leave a worktree using a copied primary database URL. Previously migration, seed and check commands accepted that URL; even a localhost check could let a seed truncate the wrong local stack. These commands now reject mismatched managed targets before creating a database client.

# Changes

- Shared identity guard validates worktree path, project ID, configured/reserved database port, loopback host and postgres database against generated local metadata.
- Linked checkouts missing metadata and URL query/fragment overrides fail closed with credential-free recovery guidance.
- Wire the guard into Drizzle config (migrate and generate), seed, counts and RLS checks. Primary checkout/deployment migration/check URLs remain supported; seed stays local-only.
- Document recovery after failed startup and shell environment overrides.

# Acceptance criteria and evidence

- Wrong managed target rejected before connection: three real subprocess entrypoints exit1 and the wrong-target listener records zero connections.
- Correct metadata accepted; copied-primary, another port, remote host, other database, bad/missing/path-mismatched metadata and URL overrides rejected:19 tests.
- Shell override regression supplies a correct fixture .env.local but wrong effective DATABASE_URL; all three commands still reject.
- Valid isolated local startup/migration/counts/RLS checks pass: ten empty public tables, two migrations, RLS on all10.

# Verification

Before the fix,16 identity cases and3 command regressions failed. After the fix,22 targeted cases pass.
pnpm verify:quick passes. pnpm verify passes:386 unit tests with10 opt-in DB skips, successful production build,287 browser tests with103 conditional skips and zero retries. Format, lint, types and ticket validation pass.
Verified against develop647b7dc07b1836ac6a2337f35d8848e98b5e885d.

# Risks and rollout

No migration or dependency changes. All managed URL query parameters are rejected deliberately to prevent target overrides; use the generated direct local URL. The helper parses the exact generated Supabase config shape, so a generator format change must update its tests. Metadata is developer-controlled: this is accidental-target protection, not access control.

This does not alter application runtime database connections. No production connection, seed, reset or data deletion was performed. TICKET-006's complete two-stack lifecycle proof remains separate. Rollback is reverting this PR, which restores the accidental-target risk.

# Screenshots / UI checklist

N/A: no UI changes.

# Harness changes

Database command validation only; no hooks, test gates or CI rules bypassed. Review with pnpm test scripts/**tests**/database-target.test.ts scripts/**tests**/database-target-command.test.ts; these use temporary fixtures and an inert loopback listener, not guest data.
