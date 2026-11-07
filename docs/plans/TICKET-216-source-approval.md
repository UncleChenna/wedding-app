# TICKET-216 source/history/recovery review — 6 November 2026

> Superseded for execution review on7 November: develop now owns0014. Read
> [the changed-path and scope report](TICKET-216-develop-drift-2026-11-07.md).
> The old13-path JSON remains expired; do not create a record from it.

Status: proposal only. No human record exists; no working source merge has started.
No phase is PM accepted. This plan supersedes the earlier 0013-0015 proposal.

## Inputs and numbering correction

The integration worktree remains on its earlier base c9c9e66010ee773189477139d4f8b0d30cf481e1.
Its latest published preparation before this review is 47eecd068dcb9f0278d9c5630219d08bdcb80cca.
A fresh fetch found develop at 6fb465347a1426112783a7bf07860d2b71a8c493, including PR91's
0013_fresh_doctor_faustus order-alert outbox migration. T211 remains
7ea316ba4bddcfcb418e7c180c2fae03af81e618. No shared branch was merged or reset.

Consequently the old proposed 0013-0015 names cannot be used against current
develop. Preserve its new 0013 and append 0014-0016. The functional scope and
13-path count stay narrow, but exact generated paths change and require review;
this is not an extension of any previous authorization. Recheck numbering if the
pinned target advances again; approval cannot silently cover replacement paths.

## Exact protected paths and disposition

All paths are relative to the TICKET-216 worktree. Three incoming SQL files are
absent from the current develop-based tree; removing incoming merge copies does
not delete SQL belonging to develop or modify any database's applied history.

| Proposed path                                      | Source action / final disposition relative to current develop                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| drizzle/0006_member-rsvp-foundation.sql            | Remove incoming fork copy from the active chain after archive verification; remains absent from develop's tree. |
| drizzle/0007_member-rsvp-backfill.sql              | Remove incoming fork copy from the active chain after archive verification; remains absent from develop's tree. |
| drizzle/0008_preserve-large-household-capacity.sql | Remove incoming fork copy from the active chain after archive verification; remains absent from develop's tree. |
| drizzle/meta/0006_snapshot.json                    | Resolve conflict to exact develop bytes; no final change versus develop.                                        |
| drizzle/meta/0007_snapshot.json                    | Resolve conflict to exact develop bytes; no final change versus develop.                                        |
| drizzle/meta/0008_snapshot.json                    | Resolve conflict to exact develop bytes; no final change versus develop.                                        |
| drizzle/meta/_journal.json                         | Modify through tooling: preserve existing 14 entries verbatim in order, append three entries.                   |
| drizzle/0014_household-member-key.sql              | Add using Drizzle.                                                                                              |
| drizzle/meta/0014_snapshot.json                    | Add using Drizzle.                                                                                              |
| drizzle/0015_member-rsvp-foundation.sql            | Add using Drizzle.                                                                                              |
| drizzle/meta/0015_snapshot.json                    | Add using Drizzle.                                                                                              |
| drizzle/0016_member-rsvp-backfill.sql              | Add through Drizzle --custom, then author only this new unapplied SQL.                                          |
| drizzle/meta/0016_snapshot.json                    | Add using Drizzle.                                                                                              |

The old proposed 0013_household-member-key and its snapshot are replaced by
0014_household-member-key and its snapshot. Old proposed 0014_member-rsvp-foundation
moves to 0015_member-rsvp-foundation; old proposed 0015_member-rsvp-backfill moves
to 0016_member-rsvp-backfill. Generic snapshot filenames follow those new numbers.
Develop's real 0013 SQL and 0013 snapshot are excluded from the write proposal.
No applied migration is being renamed: these are unapplied candidate artifacts.

## Mapping from the original fork

| Original fork change                                                                                  | Earlier candidate           | Corrected current-develop candidate                                                                     |
| ----------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| 0006 member foundation: referenced composite unique key                                               | 0013 household-member-key   | 0014 household-member-key; create key before its foreign key.                                           |
| Remainder of 0006: member responses, retry receipts, legacy-record table, fields, constraints and RLS | 0014 member-rsvp-foundation | 0015 member-rsvp-foundation; retain current ordering/staff/request-budget/outbox schema.                |
| 0007 member backfill                                                                                  | 0015 member-rsvp-backfill   | 0016 member-rsvp-backfill, with the ambiguity refusal described below.                                  |
| 0008 preserve-large-household-capacity                                                                | Folded into candidate 0014  | Folded into corrected 0015: replace the old upper-bounded capacity constraint with max_tag_alongs >= 0. |

The capacity change neither clamps values above ten nor deletes people. It
removes the old database upper bound while retaining nonnegativity. It does not
implement or authorize the separate admin-approved extra-guest workflow.

## Archive and integrity

Repository archive: docs/migration-history/TICKET-211-7ea316ba.tar.gz.
Manifest: docs/migration-history/TICKET-211-7ea316ba.json. Both are versioned,
including in published preparation 47eecd068dcb9f0278d9c5630219d08bdcb80cca.
Archive SHA-256:
a0a6a8addb83a3c78c5846eb3c3b5709de0b7f3a0c3ebda3bf1ef7a3d1fb0d2e.

Git archive preserved exactly three original fork SQL files, snapshots0006-0008
and the original journal from full source7ea316ba4bddcfcb418e7c180c2fae03af81e618.
All seven regular files were compared byte-for-byte to that source; the manifest
records each length and SHA-256. Archive hash and all seven comparisons were
reverified during this review. Original branch/worktree/database remain intact.
This source archive is not a database backup or an executable migration chain.

## Preserving develop and using the required tooling

Keep every develop SQL file0000-0012 unchanged, and also preserve its newly merged 0013. Preserve snapshots0000-0013 and the existing14 journal entries, including
indices, tags, timestamps and order. Do not insert the fork journal entries.

The current ignored generator preview copied tracked develop artifacts, generated
0014 from the key-only schema, then0015 from the combined full schema, and used
Drizzle --custom for0016. Its14 prior SQL files/snapshots and journal prefix match
6fb4653 byte-for-byte / entry-for-entry. The new three SQL files match the earlier
preview's three SQL files byte-for-byte. The combined schema retains20 tables,
including the new order_alerts table. This is preview evidence only.

After human source authorization, use canonical pnpm db:generate for actual
working artifacts, with the same staged key/full/custom sequence. Check the
resulting SQL, snapshots, parent lineage and journal. Generated timestamps/UUIDs
may differ from preview; do not copy or invent metadata to force a match.

## Supported histories and execution gate still required

| Target history                                                                                   | Intended handling                                                                                                   |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Truly empty disposable database                                                                  | Full current develop plus append chain, after target/schema checks.                                                 |
| Modern schema with exact applied prefix, including former develop0000-0012                       | Allow remaining entries after full hash/timestamp/order verification; former develop also needs the new outbox0013. |
| Current develop0000-0013                                                                         | Append0014-0016 after verification.                                                                                 |
| Exact complete integrated chain                                                                  | No-op on second run; counts and journal unchanged.                                                                  |
| Original T211 fork, or partial fork including its divergent0006                                  | Refuse; no automatic replay, journal rewriting or conversion.                                                       |
| Original legacy0000 schema                                                                       | Separate destructive bridge blocker even if its first hash matches.                                                 |
| Unknown/nonempty unjournaled schema, gaps, altered hashes/timestamps or database ahead of source | Refuse; reviewed target-specific reconciliation required.                                                           |

The implemented comparison helper requires the entire applied sequence to be an
exact prefix of the source sequence, comparing every SHA-256 and timestamp and
requiring ordered valid source timestamps. Nine contracts pass, including the
actual incompatible nine-entry fork. A later timestamp is not compatibility.

IMPORTANT: that helper is not wired into the migration command yet. Existing
pnpm db:migrate cannot yet be claimed to enforce this refusal. Before declaring
the integration execution-safe, wire target/schema inspection and lineage checks
into the supported entry point before mutations, with serialization against
concurrent runners. Fail on nonempty missing-journal targets and legacy schemas;
prove command-level refusal leaves data/schema/journal unchanged. Do not execute
on an incompatible target just because pure helper tests pass.

Read-only local inventory found13 exact former-develop entries in the T216 stack
and9 exact fork entries in the preserved T211 stack; only their first6 are common.
The new develop0013 is source-verified, not claimed applied to either stack.
Hosted histories are unknown and require environment-identified read-only
inventory before any hosted plan.

## Existing data and destructive operations

Ordinary append migrations create the key, three protected tables, revision and
reopening/kind/age fields, and constraints. New tables keep RLS with no browser
policies. They do not delete/truncate existing tables, merge people, change
existing tokens or reissue invitations. New foreign keys have cascading child
cleanup semantics for future parent deletion; the migration performs no such
parent deletion and this proposal grants none.

Backfill assigns pending when no old RSVP exists, otherwise yes/no from the old
aggregate. A yes count unequal to the named-member count causes an exception and
full transaction rollback instead of guessing which people accepted. Existing
RSVP rows, identifiers, contacts, diet, arrival records and timestamp precision
are preserved. Ages remain unspecified; multi-member invitations become groups
without inferred family relationships. The old90-day retention setting becomes
365; other explicitly configured values are left alone. The legacy-record table
is created but the destructive legacy conversion is not executed.

DROP CONSTRAINT replaces the old capacity rule; it is not row/table deletion.
No blanket claim about arbitrary real data is made from synthetic cases.

## Verification and recovery

Earlier-base evidence: nine history contracts and three disposable-database
cases pass: clean/migrate-twice/RLS, populated preservation, ambiguous attendance
refusal with DDL/journal/data rollback. The original backfill failed the ambiguity
assertion before the guard. Setup errors are not regression evidence. The new
current-base chain has been generated/integrity-checked but has NOT yet passed
its clean/populated database verification or full integrated RSVP/browser gate.

CI for preparation47eecd068dcb9f0278d9c5630219d08bdcb80cca passed all five
required jobs in run42274183457. That is not CI for this future integrated source
or the newly fetched develop base. Original keyboard-timeout cause remains open.

Source recovery: use preserved pushed preparation47eecd0, the pinned develop and
original fork revisions, plus the verified provenance archive to reconstruct an
isolated checkout. Do not reset another person's changes or edit applied SQL.
Disposable preview tests only create/drop uniquely named child fixture databases;
the owned main stack and old fork stack are preserved. Do not invent automatic
production down-migrations or use the source archive as a data restore.

Hosted execution remains separately blocked pending reviewed target-specific
plan, verified backup, restore rehearsal and explicit execution authorization.
The destructive legacy bridge and any token reissue need their own review and
execution authorization. Passing tests/source approval do not permit deployment.

## Human record and expiry

The refreshed ignored proposal retains13 exact paths and the source-only purpose,
with corrected numbering and pinned current develop. It expires2026-11-06T23:01:38Z,
which is6 November17:01:38 America/Regina. Review the actual JSON; old proposals
are expired/superseded. A human must create .harness/approved-writes.json in the
T216 managed worktree. The agent must not create/copy that record, fabricate an
approval or bypass hooks. This is not hosted/destructive execution, real-data
removal, token reissue, dependency/lock changes, shared merge or PM acceptance.
