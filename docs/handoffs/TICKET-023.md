# TICKET-023 — 2026-10-26

Owner divine; agent codex; branch TICKET-023; base a6ec36d. Managed stack wedding-13b237dc87ea; app port 20850; browser port 20851.

## Changed

Invitation-scoped secure tokens, tag-along capacity/default, status/version/seating/side; guest name/phone/meal/dietary fields without per-guest QR; explicit RSVP attendance/count/response. Drizzle generated migration 0001 and metadata. ADR 0017 documents that this migration targets an empty prelaunch scaffold, not a populated guest database. Applied 0000 is unchanged. Minimal seed compatibility changes preserve buildability; the full seed redesign remains TICKET-026.

## Evidence

Baseline: all ten public tables empty, one applied migration. Six original real-DB regressions failed on the old schema, then passed after migration. Expanded suite: eight pass with transaction rollback isolation. One intervening run timed out connecting to the database; after Docker reported healthy and the normal host connection recovered, the unchanged timeout passed. Migration applied twice with identical full-table counts and two applied migrations; RLS enabled on all ten public tables. Compatible seed passed: 110 invitations, 248 guests, 28 tables, 16 menu items, 18 orders, 30 check-ins. Five seed tests pass. Quick gate passes.

Before approval, the full gate failed three existing hook tests because generated migration paths lacked exact-path authorization; 268 other unit tests pass, eight integration tests deliberately skip in the non-DB run. This is not a passing full gate. Independent production build and browser verification passed: 163 browser tests, 17 existing conditional skips. No tests or hooks were weakened.

## Current state and next action

Implementation pushed in 8668938; current develop ea5e2fac19a462efcd41281f40a0d7573bda730c integrated in 4f93490. PR: https://github.com/UncleChenna/wedding-app/pull/41. Hosted run 40411115916 passed all required checks, including migrations + seed and full verification: production build, 167 browser passes and 17 conditional skips. The previous local process handle and temporary log are unavailable; its final result is not claimed.

User approved the three generated migration paths and recording authorization in this worktree's ignored `.harness/approved-writes.json`; it expires after 24 hours and is not committed. The approval applies only to the empty prelaunch scaffold. Database evidence is in `docs/reviews/TICKET-023/README.md`. Drift generation found no changes. A later seeded migration succeeded but its following counts query timed out; that optional comparison is not claimed.

Next: commit final evidence, run `pnpm t:pr TICKET-023`, and confirm required checks on the final PR head before merging under the user's standing authorization. Record completion through the CLI only after the merge, then select the next ready ticket. No populated guest database deployment is authorized.

Final local `pnpm t:pr TICKET-023` gate exited successfully: 271 unit passes, eight opt-in DB skips, build passed; browser results were 165 first-attempt passes, two retry passes (desktop ivory-gold invitation keyboard-focus checks at 768/1280), and 17 conditional skips. These two flaky checks are disclosed rather than counted as first-attempt passes. The CLI moved the ticket to in_review and pushed its metadata. Hosted checks on the final head remain required before merge.
