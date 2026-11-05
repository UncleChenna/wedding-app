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
Public form browser matrix: 12/12 pass across four themes and three widths for AA,
keyboard order, 44px targets, overflow and no-store. Admin-reader unit tests cover
permission checks before data, private matching and pagination.

The schema and budget proposal are reviewable in
`docs/reviews/TICKET-048/migration-approval.md`. Generated SQL remains local,
unapplied and uncommitted pending exact-path approval. Therefore persistence and
the full submit-to-admin journey are **not verified or operational yet**. The
proposed separate limit is 10 requests per network per minute; lookup/PIN limits
are unchanged. Migration numbering must be reconciled with pending PR99.

Remaining: approved isolated migration, database/browser integration, full verify,
UI evidence including admin/success/error states, performance and device checks.

# Rollout and risks

Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1. Do not deploy this
draft without the approved migration. Production application is not authorized.
Application rollback retains submitted requests; no destructive cleanup is proposed.
Shared networks may hit the submission limit. All request contacts are private
personal data and need the existing event-retention policy applied before release.
No automatic sending, new service, dependency or CI change is included.
