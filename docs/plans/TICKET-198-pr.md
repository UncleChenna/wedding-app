# Ticket

TICKET-198 — Build the home page and invitation frontend preview.

# Summary

Guests previously reached generic placeholders and the owner had no index of implemented pages. This adds a wedding welcome for Uchenna and Adaora on 19 December 2026, invitation-link guidance, and a reviewer index with a themed invitation preview. Venue and time remain unconfirmed; the preview labels its sample photo, venue and dress code.

# Changes

- Replace `/` and `/invite` placeholders with responsive server-rendered pages and public sharing metadata/image.
- Add `/dev` navigation and `/dev/invitation` with theme selection and the approved IV wording. The map points to explicitly sample details; the RSVP section explains that nothing is submitted.
- Add behavioral and browser coverage, including the common accessibility route inventory, three widths, both themes, keyboard access, 44px links and 80-character names.
- Queue urgent TICKET-199 for RSVP screens and TICKET-200 for table ordering. Keep TICKET-015 paused; full invitation integration remains in its existing tickets.

# Acceptance criteria and evidence

All four ticket criteria are checked: navigable public pages, honest invitation preview, available/pending navigation, and automated verification. See docs/reviews/TICKET-198.md and its 24 screenshots. This does not certify the production invitation or real-device readiness.

# Verification

pnpm verify:quick and pnpm verify passed: 200 ticket definitions, formatting, lint, types, 234 unit tests, production build and 117 browser tests; 15 pre-existing skips. UI checklist and performance measurements are in docs/reviews/TICKET-198.md. Real WhatsApp iOS/Android testing is not available and remains unverified.

# Risks and rollout

Presentation only: no database migration, token authentication, RSVP persistence or staff integration. `/dev` contains public samples, no guest data, and is noindex. Replace sample photo/location before sending real invitations. Human review/merge into develop only. Rollback by reverting this ticket's commit; no data changes to undo.

# Screenshots

All four pages × both registered themes × 375/768/1280 are in docs/reviews/screenshots/TICKET-198/. Start at `/dev`, follow every available link, switch the invitation theme, and verify sample labels. Public home only links to the preview index during development; production reviewers visit `/dev` directly.

# UI checklist

See docs/reviews/TICKET-198.md for per-item PASS/PARTIAL/NOT VERIFIED/N/A and evidence. Real-device WhatsApp checks and complete performance/CLS evidence remain review requirements; this is not final UI approval.

# Harness changes, if any

No hook, CI or shared workflow changes. The next frontend delivery order is recorded in docs/frontend-delivery.md and scoped follow-up tickets.
