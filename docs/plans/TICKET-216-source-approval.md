# TICKET-216 protected migration source review

Status: proposed, not authorised. No live human record has been created by this session.
The current short-lived JSON is ignored artifacts/TICKET-216/migration-source-approval-for-human.json.
It is scoped to this managed worktree only. Recreate a current proposal after expiry;
never reuse or extend the old TICKET-211 approval.

## Intended history resolution

Preserve develop migrations 0000-0012 and their order byte-for-byte. Preserve the
original TICKET-211 fork (old 0006-0008 SQL, snapshots and journal) byte-for-byte in
a Git-produced provenance archive linked to 7ea316ba. Keep its existing local
stack untouched. Resolve the active metadata conflicts back to develop's lineage;
then run Drizzle against the key-only and full combined schemas to append 0013
and 0014, followed by a Drizzle-generated custom 0015 backfill. No applied SQL
is hand-edited. The old branch files are archived, not silently substituted into
the newer chain. A divergent applied journal must refuse automatic migration.

The 13 exact paths include six temporary fork/metadata conflict paths and seven
active append/journal paths. Existing develop SQL 0000-0012 is not in the request.
The exact list and scope appear in the proposed JSON; no glob or directory grant.

## Preview effects and evidence

- 0013 creates the referenced household/member composite unique key first.
- 0014 adds member response/retry/archive tables with RLS and no browser policies,
  revision/reopening/kind/age-band fields, the 365-day default and nonnegative
  group allowance. Existing ordering, staff and request-budget schema is retained.
- 0015 refuses inconsistent aggregate/named-member attendance before any backfill;
  otherwise it backfills existing response meanings without creating/merging
  people or changing existing RSVP rows, keeps ages unspecified, labels multi-
  member invitations as groups without inferring family ties, and updates the
  superseded 90-day retention setting to the approved one-year default.

Ignored preview SQL and hashes are available under .harness/migration-preview/out
and artifacts/TICKET-216/preview-sql-hashes.json. Drizzle generated every preview
artifact; only the new, unapplied custom SQL was authored after --custom.
Three guarded local cases pass: fresh/migrate-twice/RLS, populated preservation
(shared contacts, dietary notes, microsecond precision and arrivals), and ambiguous
attendance refusal with full DDL/journal/data rollback. The ambiguity assertion
failed against the original backfill before the guard. Earlier fixture-setup
failures are retained and are not regression or green evidence.

## Scope, recovery and boundaries

The human must create .harness/approved-writes.json in
/private/tmp/wedding-phase0-local/.worktrees/TICKET-216 after review, with the
exact proposed paths/reason and an unexpired short timestamp. The record permits
source work only. It is not hosted execution, destructive bridge, real-data
removal, token reissue, dependency update, shared merge or PM acceptance.

Source recovery is the preserved pre-integration commit
ae13c7085776666e6483d9a5359002d6c853a314 and the untouched original branch plus
provenance archive. Do not reset someone else's working changes. Local previews
use newly created synthetic fixture databases and close/drop only those recorded
fixture names after testing; the main 13-migration worktree database and original
211 database remain unchanged. A hosted rollback/recovery plan requires the
actual target inventory, verified backup and restore rehearsal before execution.
