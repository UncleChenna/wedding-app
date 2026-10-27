# Ticket

Ticket: TICKET-025

# Summary

Event configuration and RSVP audit history need a persistent database contract. This draft starts with typed draft defaults and validation; tables, migrations and database verification remain unfinished.

# Changes

- Approved couple/date, tag-along and retention defaults; undecided event details remain null.
- Validated time zone, HTTPS map link, date/time and bounded operational limits.
- Typed read helper returns fresh defaults only for an absent row; corrupt data and outages remain errors.

# Acceptance criteria and evidence

All database acceptance criteria remain incomplete. Fifteen default/validation/read-helper tests pass after initial missing-module failures. The real singleton constraint, database accessor and append-only history are next.

# Verification

Managed isolated stack is healthy and existing migrations applied. Fifteen targeted unit tests and Prettier pass. No migration, real database constraint or full-gate results are claimed for this ticket yet.

# Risks and rollout

No live event is activated. Venue time zone is unknown and no UTC cutoff is inferred. Ordering stays closed. Three open orders, 30-second cooldown and ten items are provisional stored defaults, not implemented enforcement. No schema changes yet; revert this increment to remove the new helpers.

# Screenshots

N/A: no UI changes.

# UI checklist

N/A: no rendered interface, styles, images or motion changed.

# Harness changes

None. Existing shell guard remains enabled; quoted commands avoid its multiline parsing false positive.
