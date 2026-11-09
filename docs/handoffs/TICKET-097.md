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

## Authenticated verification checkpoint — 22:20 UTC

Foundation `c28be978` is pushed. Added `e2e/admin-dashboard.spec.ts` to the existing
guarded real Auth admin journey runner. It uses distinct synthetic allowlist
addresses and keeps automatic OTP/TOTP artifacts disabled. The test checks denied
and authorized HTTP responses, starts its timer before an actual canonical scan
insert and requires visible arrival changes in under two seconds, checks initial
CLS zero, retained stale counts, every theme at three widths, keyboard refresh,
and real cookie-removal denial. Screenshots contain only the control room after
authentication. The CI job retains its original artifact step and adds a separate
TICKET-097 artifact upload; no service, timeout or assertion is weakened.

The runner also executes the two real aggregate database tests. New opt-in flag
is documented in `.env.example`. CI harness/parity tests pass 15/15 and latest
quick lint/types pass. Independent source/CI follow-up review is clean after the
timer was moved before the insert. Actual hosted browser results are still pending.
Local Docker has four other healthy Supabase stacks; none were touched and no
additional full stack was started. Own native PostgreSQL remains stopped.

## Browser evidence and responsive follow-up — 22:28 UTC

Published `c5cc9980`, CI run42711031495. Its real authenticated admin journey
passed in both browser projects, including the two database fixtures, OTP/TOTP,
API denial/allowlisting, stale retention and cookie-removal clearing. Admission
insert-start to visible count was 997.595ms mobile and 589.157ms desktop; both
measured initial CLS0. All theme/width axe and keyboard checks passed. Downloaded
26 screenshots and two timing JSON files to `/private/tmp/TICKET-097-hosted-evidence`;
independent098 inspected every image with no product blocker. Mobile fixed nav
obscures one card in the stitched full-page artifact, requiring scrolled evidence.

Full local unit suite passed1745 tests/187 conditional skips in139.56s; critical
coverage98.27%lines/98.46%branches. Log `/tmp/TICKET-097-full-unit.log`.
No database or local browser server is running.

Responsive follow-up makes the five counters two compact columns at375, shorter
details and 36px numbers (desktop remains48px/three columns). It adds explicit
375 scrolled viewport screenshots and assertions for RSVP/arrival readability
above the fixed nav. This newer layout still needs hosted browser/visual review;
do not treat the previous screenshots as proof of its rendering. Quick lint,
types and14 related tests passed before the final static explanatory paragraph
was moved below the cards. Publish the refinement and inspect its new artifacts.

TICKET-061 readyPR144 repaired finalhead96a03e2b is monitoring CI42711548045;
TICKET-123 readyPR145 finalheada07d30d0 monitors CI42710951859. Neither is merged
yet. Keep097 draft until061 merges and final combined verification passes. When
integrating their CI edits, keep guest/scanner/admission/offline fixtures before
the ordering browser fixture, whose cleanup retains a closed settings singleton.

## Responsive review complete — 22:38 UTC

Responsive source `6a313ab50081650301a4df89d632e41b162f10a7` is published.
CI42712187041 passed its actual authenticated admin browser job: mobile update
993.8ms, desktop994.9ms, bothCLS0. All-theme accessibility, keyboard, 44px targets,
stale retention and real expiry clearing pass. Every one of42new images was
independently reviewed clean (24fullpages,16scrolledphoneviews,2stale). The
scrolled captures prove RSVP/arrival totals are readable above fixed navigation.
Evidence copied from `/private/tmp/TICKET-097-responsive-evidence` into
`docs/reviews/TICKET-097/{mobile,desktop}`. These supersede the older single-column
images. Canonical PR body now contains the complete UI checklist with remaining
integration/CI gates explicit.

TICKET-123 final CI42710951859 is now all7green at a07d30d0. Its editor is merging
first after fresh checks; wait for actual merge confirmation. TICKET-061 editor
will integrate123 and rerun combined checks before merging. Root097 then needs
that combined base, preserving both admin and ordering/scanner CI additions.
No production application is authorized or attempted; ownPG39021 stays stopped.
