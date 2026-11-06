# TICKET-175 integration proposal

Current source: 5307de1b1cae6ecfeccc9ed5300513d6c1324ac6.
Proposed base: develop 6fb465347a1426112783a7bf07860d2b71a8c493 (merged PR91/TICKET-084).
Merge preview conflicts only in drizzle/meta/0013_snapshot.json and drizzle/meta/_journal.json.
The schema and package manifest merge automatically. Existing branch has not been updated.

Preserve develop's committed 0013_fresh_doctor_faustus.sql, 0013_snapshot.json and
journal history unchanged. Keep both the outbox and invitation-photo schema definitions.
Remove this PR's old 0013_invitation-photos.sql and regenerate its equivalent photo-only
migration as 0014_invitation-photos.sql and meta/0014_snapshot.json using Drizzle; the
journal gains the new entry. This exception supersedes the old photo migration only
on this unmerged branch. The old photo migration was applied to the disposable local
TICKET-175 database, so it must not be silently rewritten as if never applied.

Authorize exact protected paths for integration and recording:

- drizzle/0013_invitation-photos.sql (remove old branch migration)
- drizzle/0013_fresh_doctor_faustus.sql (unchanged develop)
- drizzle/meta/0013_snapshot.json (unchanged develop)
- drizzle/0014_invitation-photos.sql (generated replacement)
- drizzle/meta/0014_snapshot.json (generated replacement)
- drizzle/meta/_journal.json (develop history plus generated entry)

For integration verification, reset only TICKET-175's disposable managed database
wedding-0c649f187525 via the guarded db:reset command after confirming it contains
only synthetic test data. This removes that stack's test rows/Auth accounts; no other
stack or production data is included. If any non-test data is found, stop and request
a separate preservation plan instead. Reapply complete migrations twice, compare
counts, check RLS, rerun explicit photo integration/authenticated browser tests and
the full verification gate. Do not change protected CI, existing policies or secrets.

No production application, direct develop push or PR merge is included.
