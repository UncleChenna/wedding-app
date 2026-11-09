# TICKET-097 — 2026-11-09

Root is sole editor, owner divine/codex, branch TICKET-097. Started ahead from
develop `143b4d637b8bfc4597f8f990a5085f2722454967`, after TICKET-108 merged and
was marked done (`c30adb96` pushed). Draft PR #146:
https://github.com/UncleChenna/wedding-app/pull/146

## Current implementation

The admin control room now renders a small live-counter component in place of
“Coming soon”. `/api/admin/dashboard` checks current two-factor admin access on
every request and returns only allowlisted counts with private/no-store headers.
A single PostgreSQL statement provides a consistent snapshot. Invitations sent
counts active sent/RSVP households; RSVP yes counts accepted people, excluding
revoked/draft invitations; arrivals sums canonical admissions. Orders are counted
once per guest submission using station state, with a documented parent fallback
for historical childless orders. All-cancelled orders are excluded; served plus
cancelled is complete; legacy ready remains open.

The client polls serially every second while visible, with an eight-second bound
covering headers/body, abort and generation guards, no fabricated zeroes on errors,
and last-known stale wording. Authorization denial clears counts and stops polling.
The refresh button gives immediate feedback. No database/RLS/schema change.

## Evidence and remaining work

- Missing endpoint module established the initial red test; endpoint/UI focused
  suite subsequently passed 14 tests. Quick lint/types/14 related tests passed.
- Independent foundation review found legacy ready omission and denial overwritten
  by offline status. Both fixed. The offline-after-denial test was reproduced red
  then green; final focused suite passed 12 endpoint/UI tests.
- Real isolated PostgreSQL aggregate tests pass 2/2, including synthetic active,
  draft/revoked, partial arrivals, split stations, cancelled and childless ready
  cases. Each fixture rolls back without disabling guards. Initial public tables
  were zero; unchanged migrations applied successfully. No Auth/Realtime claim.
- UI browser/all-theme screenshots, actual admission-to-dashboard under two
  seconds, real authenticated HTTP tests and final CI remain unverified.
- TICKET-061 is in progress; integrate only after its verified merge and keep this
  PR draft until all prerequisites and evidence are complete.

Native PostgreSQL16 uses reserved port39021; its owned temporary directory is
recorded in ignored `.harness/temporary-postgres-path`. Project
`wedding-90576700d14b`, app39030/browser39031. Preserve the database backup when
stopping. Never use the copied primary DATABASE_URL. Explicit local test URL:
`postgresql://postgres@127.0.0.1:39021/postgres`. The guard validates this identity.
The database is now stopped with its data directory retained. Final quick gate
passed lint, types and 14 related unit tests; the two opt-in database tests are
skipped in that quick run and passed separately with the real database above.

Next: finish/push this foundation checkpoint, get follow-up review, add production
browser/visual evidence and authenticated CI coverage. Existing admin journey uses
real Supabase OTP/TOTP; local native PostgreSQL alone cannot certify that flow.
TICKET-061 editor024 owns its branch; TICKET-123 editor theme_fixes owns its branch.
Both are independently reviewed and advancing through final combined CI. Root097
has no broad-test slot while123 runs its full suite.
