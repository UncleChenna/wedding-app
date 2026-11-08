# TICKET-024 migration proposal — 2026-11-08

Base integrated: develop2706b96, through migration0015. The attempted generator
was rejected before execution because the existing approval covers unchanged base
files only. No new migration has been generated or applied.

## Exact proposed generated outputs

- `drizzle/0016_admission-expand.sql`
- `drizzle/meta/0016_snapshot.json`
- `drizzle/0017_admission-backfill.sql`
- `drizzle/meta/0017_snapshot.json`
- `drizzle/0018_admission-guards.sql`
- `drizzle/meta/0018_snapshot.json`
- `drizzle/meta/_journal.json`

Record authorization in `.worktrees/TICKET-024/.harness/approved-writes.json`.
Use Drizzle generation for the expansion and custom-migration scaffolds; populate
the new, unapplied custom SQL from the reviewed proposals below. Never rewrite
an applied migration or the existing0015-and-earlier chain.

## Reviewable behavior

1. Expansion: schema.ts already proposes RLS-enabled admission_counters and
   scan_events plus scan_result. Preserve check_ins. Constrain counts/results,
   unique retry event IDs, nullable unknown invitation, live staff/device identity,
   restrictive references and indexes for invitation/device/staff queries.
2. Backfill: `backfill-proposal.sql` locks source tables, checks every old row has
   an invitation mapping, copies original event IDs/times and known actors,
   deterministically caps canonical allocation at RSVP allowance, retains excess
   physical reports as conflicts and leaves the archive unchanged.
3. Guards: `guards-proposal.sql` makes evidence append-only, prevents counter
   removal/decrease or totals diverging from events, verifies authoritative RSVP
   allowance, rejects unsafe RSVP reductions and source truncation, and updates
   counters when admitted events are inserted. Consumers must lock invitation first.

## Requested scope and verification

Authorize generation, isolated testing and commit of these exact files, plus the
approval record. Restart only TICKET-024's existing isolated Supabase project
`wedding-87b768edd6c7` if capacity permits. No reset, deletion of existing data,
other collaborator stack changes, production application, RLS policy changes or
PR merge is included.

Previously nine proposal tests passed on an older base, including populated modern
and bootstrap preservation, immutable evidence, retry uniqueness and concurrent
final admission. This is not final-migration evidence. Run fresh tests against the
combined base, apply final generated migrations twice and compare counts, check
all public tables retain RLS, and run full verification before requesting review.
If any guard or preservation test fails, keep the ticket incomplete and fix the
unapplied proposal before committing. Do not weaken assertions or claim missing
verification passed. Populated pre0001 deployment upgrades remain outside scope:
the earlier0001 migration is approved only for an empty scaffold.
