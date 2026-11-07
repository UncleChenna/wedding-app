# TICKET-216 develop drift review — 7 November 2026

Status: changed scope for PM review, not authorization or Phase0 acceptance.
No human record exists. The expired proposal JSON has not been refreshed or
renumbered. Do not use it to create a record for current develop.

## Source comparison

Reviewed develop:6fb465347a1426112783a7bf07860d2b71a8c493.
Current fetched develop:205cc66350864c0a4f57c392db7b663ff20bf25c.
Fork source remains7ea316ba4bddcfcb418e7c180c2fae03af81e618.
The branch remains on its old integration base; no base merge or protected source
write was performed. Current develop merged PR107/TICKET175 invitation photos.

Changed migration paths since the reviewed base:

- Added drizzle/0014_invitation-photos.sql.
- Added drizzle/meta/0014_snapshot.json.
- Modified drizzle/meta/_journal.json: append idx14, tag0014_invitation-photos,
  timestamp1794003345731. Existing14 entries unchanged.

The current source also changes the shared schema, package.json and pnpm-lock.yaml,
including the upstream sharp0.35.5 dependency. These are existing develop changes,
not a dependency selection or lockfile edit performed by this work.

Reverified byte-for-byte: all14 reviewed develop SQL files and snapshots retain
their bytes. The original7-file fork archive/hash also still matches its pinned
source and manifest. New migration histories on actual databases remain unknown;
this read-only source audit makes no claim that the new photos migration ran.

## Revised mapping, not silently applied

| Earlier candidate           | Current-develop candidate   | Behaviour                                                                                                                            |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0014_household-member-key   | 0015_household-member-key   | Composite key before dependent foreign key.                                                                                          |
| 0015_member-rsvp-foundation | 0016_member-rsvp-foundation | Member/receipt/archive tables and fields; include original fork0008's nonnegative capacity change without clamping large households. |
| 0016_member-rsvp-backfill   | 0017_member-rsvp-backfill   | Preserve old responses and reject ambiguous aggregate attendance.                                                                    |

Preserve develop0000-0014 SQL and snapshots and the existing15 journal entries.
No applied migration is renamed. The new numbers are proposed for unapplied
artifacts only; no corrected current-base chain has been generated or applied.
The original fork0006 maps to key0015 plus foundation0016, fork0007 to backfill0017,
and fork0008's capacity change to foundation0016.

The revised migration-specific13-path list would be:

```text
drizzle/0006_member-rsvp-foundation.sql
drizzle/0007_member-rsvp-backfill.sql
drizzle/0008_preserve-large-household-capacity.sql
drizzle/meta/0006_snapshot.json
drizzle/meta/0007_snapshot.json
drizzle/meta/0008_snapshot.json
drizzle/meta/_journal.json
drizzle/0015_household-member-key.sql
drizzle/meta/0015_snapshot.json
drizzle/0016_member-rsvp-foundation.sql
drizzle/meta/0016_snapshot.json
drizzle/0017_member-rsvp-backfill.sql
drizzle/meta/0017_snapshot.json
```

The first7 have the same archive/removal, restore-develop-metadata and append-only
journal roles as the prior plan. The last6 are new generator-produced artifacts.
Generic snapshot0015/0016 filenames stay in the list but their generation stages
shift. Compared with the prior13-path list, remove0014_household-member-key.sql,
meta/0014_snapshot.json,0015_member-rsvp-foundation.sql and0016_member-rsvp-backfill.sql;
add0015_household-member-key.sql,0016_member-rsvp-foundation.sql,
0017_member-rsvp-backfill.sql and meta/0017_snapshot.json.

## Additional upstream carry-over protection

The earlier13-path plan omitted protected upstream carry-overs needed when
conventionally merging develop into this older checkout. Current hooks check
all protected staged changes, including unchanged upstream imports; they do not
provide a verified-upstream exemption. This finding is from hook/source analysis,
not an attempted or rejected source merge. No protections were bypassed.

Five additional exact paths would therefore need an explicit source-copy exception
for that workflow, separately from generated/mutated migration sources:

```text
drizzle/0013_fresh_doctor_faustus.sql
drizzle/meta/0013_snapshot.json
drizzle/0014_invitation-photos.sql
drizzle/meta/0014_snapshot.json
pnpm-lock.yaml
```

Each must match source205cc66350864c0a4f57c392db7b663ff20bf25c exactly. Their
SHA-256 values/lengths are recorded in ignored
artifacts/TICKET-216/2026-11-07-upstream-carry-over.json. This would not permit
manual edits, different dependency versions or an arbitrary lockfile change.
A combined record for this conventional merge workflow would contain18 exact
paths, not13. This is a proposed scope correction requiring explicit review;
the PM's earlier13-path scope acceptance is not treated as approving it.
Do not change Git workflows just to conceal protected staged differences.

## Next gate and independent evidence

Report this changed scope before requesting a new human approval record or
creation command. Do not refresh only the expiry on the obsolete list. After
review, pin the approved source revision and prepare the exact-path JSON/command;
any later numbering change needs separate review, never silent renumbering.

After the human record exists: integrate sources; generate canonical artifacts;
prove source/archive integrity; wire target/schema/full-prefix validation into
the actual migration entry point with concurrency protection and command-level
no-mutation refusal tests; run clean/populated/repeat/ambiguity/RSVP/default-worker
checks and CI on the final source commit. The helper remains unwired today.

All five required CI jobs passed on preparation efd02fbbb3a57823ad98b9329766459f681006f7.
That does not verify current develop205cc66 or future integrated source. Original
keyboard-timeout cause remains unresolved. No source integration, human record,
hosted execution, destructive legacy conversion, token reissue, shared merge,
new dependency installation or PM acceptance occurred during this review.
