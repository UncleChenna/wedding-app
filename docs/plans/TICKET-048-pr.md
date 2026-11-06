# Ticket

TICKET-048 — Let guests request their link again.

# Problem and intended result

Guests currently need to contact the couple directly to recover a lost invitation.
This ticket will add a neutral public request form and a private admin queue with
the existing Share menu. It will not send messages automatically.

# Changes and verification

Public /lost-link form and server action, authenticated /admin/link-requests queue,
pagination, ShareMenu reuse and navigation are now implemented in code. Requests
match only in the private admin queue; supplied contacts never receive a link
automatically. The existing navigation test was extended for the new queue link.

Quick gate: lint/types and 143 related passes / 67 skips. Production build passes.
Public form browser suite: 15/15 pass, including zero measured load CLS at three widths.
The matrix covers four themes and three widths for AA,
keyboard order, 44px targets, overflow and no-store. Admin-reader unit tests cover
permission checks before data, private matching and pagination. All 12 initial-form
screenshots are captured and visually reviewed in docs/reviews/TICKET-048/screenshots.
Six component tests cover pending, failure/retry and received state announcements;
these use mocked action state and do not certify successful database submission.

The schema and budget proposal are reviewable in
`docs/reviews/TICKET-048/migration-approval.md`. The user approved the migration
and separate 10 requests per network per minute limit on 2026-11-06. Generated SQL
is committed and applied only to this isolated database. The full submit-to-admin
journey is **not verified yet**. Lookup/PIN limits
are unchanged. Migration numbering must be reconciled with pending PR99.

Three serial production mobile Lighthouse runs of /lost-link score Performance100,
Accessibility100 and CLS0 each. See docs/reviews/TICKET-048/performance.json and
ui-review.md for evidence and remaining checklist items.

Migration repeatability passed with identical row counts and 14 journal entries;
RLS passed on all17tables. Three real storage tests initially passed. A fourth
test now covers10allowed/11threfused, lookup/PIN independence and expiry reset.
Both expanded runs timed out in all4tests and cleanup, including previously passing
cases. Final lint/types pass; the new budget test and authenticated browser checks
remain unverified. No test timeout or assertion was weakened. Capacity recovery is
pending permission to stop inactive owned TICKET-181 with its backup preserved.

Remaining: stable database verification, browser integration, full verify,
UI evidence including admin/success/error states and device checks.

# Rollout and risks

Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1. Do not deploy this
draft without the approved migration. Production application is not authorized.
Application rollback retains submitted requests; no destructive cleanup is proposed.
Shared networks may hit the submission limit. All request contacts are private
personal data and need the existing event-retention policy applied before release.
No automatic sending, new service, dependency or CI change is included.
