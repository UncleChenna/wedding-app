# Ticket

TICKET-034 — Decide wedding date, RSVP lock, tag-along limit and Wallet scope.

# Summary

RSVP and pass implementation depended on unconfirmed policy. The owner has now approved the defaults and explicitly deferred Wallet, while leaving venue-specific details TBD. The PRD records those decisions without inventing a time zone or claiming the event is release-ready.

# Changes

- Record Uchenna and Adaora, 19 December 2026, default one editable tag-along, midnight event-local RSVP cutoff and 90-day retention.
- Amend Journey 1 and the audit: Wallet is deferred for launch; QR webpage, saved image/screenshot, PDF and offline pass remain.
- Keep venue, time, time zone, dress code and map TBD. Require explicit zone configuration for live RSVP and real details before first send.
- Update assumptions 1–4/14 and downstream ticket notes. Keep signed-token protocol decisions with TICKET-056.

# Acceptance criteria and evidence

The owner replied “Use these defaults”, “Defer Wallet; launch with QR and PDF”, and “TBD” for event details on 2026-10-26. The approved values are in docs/prd.md#approved-event-defaults and referenced by TICKET-101. Wallet scope is an explicit PRD amendment, not a delivered feature.

# Verification

Quick/full verification passed before integrating PR #38: formatting, ticket validation, lint, types, 266 unit tests, production build, 163 browser passes and 17 conditional skips. Final post-rebase t:pr verification also passed: 270 unit tests, production build, 163 browser passes and 17 conditional skips. Required CI remains the merge gate.

# Risks and rollout

Documentation only: no database settings, account setup, delivery or deletion. Venue time zone remains required before a UTC cutoff is calculated; development/test zones must not become production defaults. The settings and release criteria track remaining details.

# Screenshots and UI checklist

N/A: no rendered UI, source behavior or theme changed.

# Harness changes

None; only the decision records and downstream acceptance checks.
