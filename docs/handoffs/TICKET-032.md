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
