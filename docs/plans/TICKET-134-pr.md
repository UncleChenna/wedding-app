# Ticket

TICKET-134 — Cover admin guest import, seating, menu and staff end to end.

# Summary

Draft combined admin setup journey. The individual features are merged; this
ticket will verify real sign-in, CSV import, seating, menu edits, staff PIN setup
and explicit invitation sharing together in CI.

# Changes

Implementation and the isolated CI Auth/database harness are in progress.
Plan: `docs/plans/2026-11-09-TICKET-134.md`.

# Verification

Not complete. No new journey or CI pass claimed yet. Acceptance remains unchecked.

# Risks and rollout

Synthetic isolated test data only; no automatic messages or production changes.
The new CI job must preserve existing verification gates and use ephemeral local
Auth/database credentials. Review, local browser verification and final-head CI
are required before merge.
