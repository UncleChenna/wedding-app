# TICKET-048 handoff

2026-11-05. Owner divine/codex. Branch TICKET-048. Base develop
c9c9e66010ee773189477139d4f8b0d30cf481e1. In progress, not complete. Draft PR: https://github.com/UncleChenna/wedding-app/pull/103.
Published implementation commit: e6994c6.

## Current work

Claimed through the shared ledger after TICKET-043 was explicitly blocked on its
physical-device review question. Managed worktree setup completed, including locked
installation, skill links and isolated database migration. App port 39410.
No other worktree or database was stopped or changed.

Added a dated plan, validated name/contact input, conservative admin match helper,
and neutral submission service with injected persistence/budget boundaries. Public
submission deliberately performs no guest lookup. Exact same-guest name/contact
matching rejects revoked/unknown statuses and ambiguous cross-household matches.
Service catches failures without returning/logging submitted contacts or database
exceptions. These are foundations only; no public route or persistence is wired.

Both test files first failed because their implementation modules did not exist,
then passed after implementation. Focused count: 21 tests. The final quick gate passes lint, type checking and all 21 related tests
for the combined changes. No browser/UI/database behavior is certified by these unit tests.

## Next steps

Implement the durable request queue/schema and dedicated submission budget, then
public form, authenticated admin queue using ShareMenu, and guide navigation.
Migration sequence must account for pending TICKET-043 migration0013; obtain an
explicit base update after that PR merges. Prepare a concrete exact-path migration
and rate-budget proposal before seeking authorization. Do not apply an unapproved
new migration or weaken existing lookup/PIN budgets.

Run real persistence/RLS/repeatability tests and the public-submit/admin-queue
journey. Complete full verification and all-theme UI review, including screenshots,
guest Lighthouse and honest physical-device results. Acceptance criteria remain
unchecked. TICKET-015 pause stays intact. See docs/plans/2026-11-05-TICKET-048.md.

## Form, queue and migration proposal — 2026-11-05

Implemented /lost-link using shared controls and a server action, plus the
/admin/link-requests queue, pagination and existing ShareMenu. Added guest guide
and admin navigation links. The private queue authorizes before all data access,
loads matches only on the server and does not route a credential to an unverified
submitted contact. Public submissions have no guest lookup path.

Added the Drizzle request table definition and a proposed separate lost_link scope
(10 requests/network/60 seconds). Generated but DID NOT APPLY or commit:
drizzle/0013_lost-link-requests.sql, drizzle/meta/0013_snapshot.json and journal.
Exact-path isolated testing/commit/budget authorization is pending through the user
question. Concrete proposal: docs/reviews/TICKET-048/migration-approval.md.
These local generated outputs must be preserved until authorization/reconciliation.
PR99 owns a different unmerged0013; never overwrite an applied migration to resolve it.

Verification: quick gate lint/types and143 related passes/67skips; production build
passes; public form browser matrix12/12 passes (four themes x375/768/1280), checking
AA axe, keyboard field/action order,44px targets, overflow and private no-store.
Admin reader tests3/3 verify auth before data, unique matches and pagination.
The first quick run correctly caught the new navigation entry missing from the
exact navigation expectation; updated it while preserving every prior entry.

Still unverified: actual request persistence and queue/re-share E2E (new SQL is
unapplied), migration repeatability/RLS, rendered admin queue, success/error UI,
screenshots/visual inspection, load stability, Lighthouse and physical devices.
The feature is NOT usable end-to-end until the migration is approved/applied.
Next: on approval record exact paths, run isolated migration tests; meanwhile
continue independent UI evidence. Full verification remains required before review.
