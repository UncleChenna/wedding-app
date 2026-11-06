# TICKET-032 handoff — 2026-11-04

Owner divine; branch TICKET-032; base develop 549b86a. Claimed through CLI and
isolated at .worktrees/TICKET-032. Local stack startup and migrations succeeded;
app port 27470. In-progress publication is running through normal Git hooks.

Read installed Next proxy/auth docs and current authentication boundaries. Admin
has live AAL2 checks at its layout/readers and an operation callback guard; staff
has live cookie/device/credential checks at its entry component. Proxy currently
does not authorize admin/staff requests and omits /bar from its matcher. Existing
station roots also host PIN bootstrap forms and must remain usable without a
session. Guest ordering stays public; invitation edits use scoped capabilities.

Next: write failing proxy/operation tests, implement prefilter and operation guards,
verify the actor matrix and production journeys, then full gate and detailed PR.
No implementation verification or completion claimed yet.

## Initial implementation — 2026-11-04

Published start commit 6e4d136. Request regressions failed 8/9 before implementation;
request and direct-operation matrix now passes 53 tests. Quick gate passes lint,
types and 45 related tests. Proxy now prefilters admin and scoped staff descendants/
API routes, includes /bar, forwards refreshed admin cookies and denies mutation
replays. Added live callback guards and a documented bootstrap/endpoint inventory.
Production build is running (session54698); browser matrix and journeys remain
pending. Existing staff journey now includes bar, cross-role API denials and live
credential-version revocation. No UI, schema, CI or policy changes.

The operation test initially returned a mock from beforeEach, which Vitest treated
as cleanup; a rejected mock then failed cleanup after the correct guard response.
Changed the hook to return void, preserving the failing-provider assertion. The
corrected full matrix passes; initial failure log is retained.

## Verification complete before review gate — 2026-11-04

Implementation 40bbd79 pushed; draft PR87 targets develop. Full local gate passed:
948 unit / 74 skips, 779 browser / 165 skips (9.4m). Production access matrix 4
passes; real staff journey 2 passes; real MFA journey 2 passes; anonymous ordering
6 passes. CI run 41752790966 passed all five jobs at 40bbd79, including the real
invitation journey. No verifier remains running. All ticket criteria are now ticked.

First staff run failed waiting for PIN responses while all local PostgreSQL stacks
were unhealthy. TICKET-032 pg_isready returned no response. Later the stack recovered
without restart or other-owner cleanup; pg_isready accepted connections and the
unchanged test passed in 15.1s. The optional old-WED-001 cleanup question no longer
blocks verification. No other owner's stack was stopped. TICKET-024 stays parked
with backup and its separate protected-file approval remains pending.

Only subsequent code change is the order test's optional ORDER_REVIEW_DIR output
path, exercised by all six order cases; no assertions changed. Next: commit/push
this evidence and test-output isolation, run pnpm t:pr TICKET-032, make PR87 ready,
and verify final-head CI. Human merge is required by AGENTS.md unless the user
provides a specific exception. No production changes or physical-device claims.

The first t:pr call stopped before running verification because four PR headings
were not the template's exact names. Corrected them to Summary, Acceptance criteria
and evidence, Verification, and Risks and rollout; content/results are unchanged.
Next t:pr must pass the actual review gate; do not treat this validation failure as
an implementation failure or a completed review transition.

## Ready for review — 2026-11-04

The corrected t:pr gate passed on 7492aa7: 948 unit passes / 74 skips, 779 browser
passes / 165 skips (8.0m). CLI recorded in_review and pushed 9877e3e with PR87's URL.
No verification process remains running. The source has not changed since the
previously passing targeted staff/MFA/order journeys; the last test-only change
routes screenshots to this ticket's artifact folder.

Next: publish this evidence-only handoff, mark PR87 ready and verify CI on its
actual final head. GitHub reported no checks on the intermediate documentation
heads, so do not reuse 40bbd79's green CI as proof for a later SHA. The configured
ready_for_review event should request a fresh run; inspect the result. Leave the
PR unmerged unless the human merges or provides an explicit exception. Then use
CLI to mark done. TICKET-185 is next ready and may proceed in its own worktree.
