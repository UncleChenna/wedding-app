# TICKET-023 — 2026-10-26

Owner divine; agent codex; branch TICKET-023; base a6ec36d. Managed stack wedding-13b237dc87ea; app port 20850; browser port 20851.

## Changed

Invitation-scoped secure tokens, tag-along capacity/default, status/version/seating/side; guest name/phone/meal/dietary fields without per-guest QR; explicit RSVP attendance/count/response. Drizzle generated migration 0001 and metadata. ADR 0017 documents that this migration targets an empty prelaunch scaffold, not a populated guest database. Applied 0000 is unchanged. Minimal seed compatibility changes preserve buildability; the full seed redesign remains TICKET-026.

## Evidence

Baseline: all ten public tables empty, one applied migration. Six original real-DB regressions failed on the old schema, then passed after migration. Expanded suite: eight pass with transaction rollback isolation. One intervening run timed out connecting to the database; after Docker reported healthy and the normal host connection recovered, the unchanged timeout passed. Migration applied twice with identical full-table counts and two applied migrations; RLS enabled on all ten public tables. Compatible seed passed: 110 invitations, 248 guests, 28 tables, 16 menu items, 18 orders, 30 check-ins. Five seed tests pass. Quick gate passes.

Before approval, the full gate failed three existing hook tests because generated migration paths lacked exact-path authorization; 268 other unit tests pass, eight integration tests deliberately skip in the non-DB run. This is not a passing full gate. Independent production build and browser verification passed: 163 browser tests, 17 existing conditional skips. No tests or hooks were weakened.

## Next

Draft PR: https://github.com/UncleChenna/wedding-app/pull/41 (pushed plan only; implementation explicitly disclosed as local). The user has approved the three generated paths and explicitly authorized recording that approval; the ticket has resumed through the CLI. Drift generation found no changes. A later migration on seeded data succeeded, but its follow-up counts command timed out connecting, so the optional post-seed count comparison is not verified. Earlier empty-database twice-apply comparison did pass.

User approval received and recorded for drizzle/0001_invitation-rsvp-model.sql, drizzle/meta/0001_snapshot.json and drizzle/meta/_journal.json and for recording that authorization in this worktree's ignored .harness/approved-writes.json. The ignored approval file expires after 24 hours and is not committed. Next, run the complete gate, inspect drift with db:generate, commit/push all ticket files and publish the detailed PR. Keep incomplete criteria unticked until verified. TICKET-195 PR40 passed its hosted retry after an initial Next font resolver failure, merged as ea5e2fac19a462efcd41281f40a0d7573bda730c, and is recorded done. Before the final TICKET-023 gate, integrate current develop, preserving both progress entries. The live queue has no other ready ticket.
