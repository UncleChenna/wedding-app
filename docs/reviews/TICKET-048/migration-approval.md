# TICKET-048 migration and request-budget proposal

2026-11-05. Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1.
Generated with `pnpm db:generate --name=lost-link-requests`.

## Approved outputs

- `drizzle/0013_lost-link-requests.sql`
- `drizzle/meta/0013_snapshot.json`
- `drizzle/meta/_journal.json`

User approved proceeding on 2026-11-06, including the proposed 10 requests per
network per minute. Authorization is recorded in the ignored worktree-local
`.worktrees/TICKET-048/.harness/approved-writes.json` for these exact paths.
Approval covers isolated local application/testing and commit only.
No production application, data reset or other worktree modification is requested.

## Changes

Adds `invitation_link_requests`: UUID, submitted name, normalized email/phone,
contact kind and timestamp, with bounded nonblank values and a paging index.
RLS is enabled without adding any policies, following ADR0003. Only authenticated
admin server code can read the queue; public submissions go through a server action.
Matching occurs in the private queue, never in the public submission path.

Adds `lost_link` to the request-budget scope constraint. Proposed policy is
**10 submissions per trusted network per 60 seconds**, independent of existing
lookup (1200/minute) and PIN (30/10 minutes) counters. Existing limits are unchanged.
Trusted-network derivation, IPv6 grouping, keyed hashes and fail-closed behavior
reuse the existing implementation. On local/non-Vercel deployments all requests
share the conservative local bucket. Guests behind a shared network can collectively
hit this limit; the form asks them to wait a minute. This needs operational review.
No email, phone or raw IP is used as a budget identity.

## Inspection and required evidence

Static inspection: one new RLS table and index; replaces only the allowed-scope
constraint; no row deletion, existing-column changes or new database policy.
Unit tests cover budget separation, neutral responses and admin authorization.
New SQL has **not been applied**. Required isolated tests: persistence, malformed
row rejection, RLS, repeated migration/row counts, unchanged lookup/PIN budgets and
submission/admin/re-share browser journey. No successful database result is claimed.

### Verification update — 2026-11-06

Supersedes the unapplied status above: migration applied successfully through the
installed Drizzle postgres-js migrator, using the guarded drizzle.config.ts and
unchanged generated files. The first CLI attempt exited 1 without an error; direct
execution completed. The normal `pnpm db:migrate` repeat then passed. Counts after
each successful run match exactly: 14 migrations, zero rows in all 17 public tables.
`pnpm db:check-rls` passed for all 17 tables. Initial three storage tests passed.

Added a fourth real-storage test for the ten-request limit, independent lookup/PIN
budgets and expiry reset. Both expanded runs timed out in all four tests and cleanup;
the new budget assertion remains unverified. Lint/types pass after correcting the
fixture's Drizzle schema typing. No timeout was increased. Full verification and
the public-submit/authenticated-admin/re-share browser journey remain outstanding.
Logs/counts: /tmp/TICKET-048-migration-repeat.log and
/tmp/TICKET-048-counts-{first,second}.txt. No production database was touched.

## Integration and rollback

PR99 independently owns a different unmerged migration0013. These PRs must be
integrated sequentially. Once that PR merges, explicitly update this branch's base
and regenerate/reconcile migration metadata with separately reviewed paths; never
edit an already applied migration or overwrite its journal entry. The present
approval is for this isolated branch's exact outputs, not a future renumbered file.

Application rollback can retain this additive request table and scope. Submitted
contact information is personal data; it is not logged, exposed publicly or sent to
an unverified address. Include this table in the existing 90-day post-event retention
process before release. This PR does not authorize destructive cleanup.

## Current approved reconciliation — 2026-11-09

Standing user authorization covers current-base integration, generated0025 outputs,
isolated synthetic reset and commit. Current SQL0025 is byte-identical to the old
branch0023 lost-link SQL; develop0023 staff alerts and0024 RLS remain unchanged.
Before guarded reset, all application tables were empty except one expired budget;
five Auth accounts were all example.test fixtures. Only owned048 was reset.
All26 migration journal entries applied; repeat counts match, four database tests
pass and all24 public tables retain RLS. No production application occurred.
Application rollback retains the additive table/scope; do not delete collected
requests or reverse already applied migrations. Existing retention requirement stays.
