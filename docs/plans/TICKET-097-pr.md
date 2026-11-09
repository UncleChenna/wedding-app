# TICKET-097: show live counters on the admin dashboard

## Problem and intended result

The control room still says “Live dashboard — Coming soon”. This ticket adds
authenticated, automatically refreshed invitation, RSVP, arrival and order counts.
Arrivals count people from canonical admission counters, not scan attempts.

## Changes

- Reads a consistent aggregate snapshot without returning names or contact details.
- Adds a private, uncached endpoint that checks current admin access on every request.
- Displays clearly labelled counts, with visible refresh/error states and no invented
  zeroes when the database or connection is unavailable.
- Refreshes while the dashboard is visible; stops requests when hidden or signed out.

## Acceptance and verification

- [x] Counter semantics and database fixture results verified (2 isolated PostgreSQL tests).
- [ ] Admission appears within two seconds in a browser test.
- [x] Denied access, interrupted requests, stale data and retry behaviour verified (focused unit tests).
- [ ] Mobile layout, keyboard, reduced motion and all-theme accessibility checked.
- [ ] Independent review and final CI pass.

## Dependencies and limitations

Started ahead from develop `143b4d63`. TICKET-061 remains in progress and must
merge before this PR becomes ready. Foundation implementation and unit/database
verification are complete; browser, visual and final CI checks remain outstanding.
No schema, production database or RLS change is included.

## Review and rollback

Review the counters on `/admin` after two-step sign-in. Final evidence and exact
review steps will replace this draft checklist when implementation is complete.
Rollback reverts this ticket's endpoint and presentation; no data is changed.
