# Admission storage contract under review

TICKET-024 · 2026-11-04. Proposed, not deployed or database-verified.

## Two counts, never one overloaded field

A scan event records what happened on the device separately from what the server
can accept against the invitation allowance. If two disconnected devices each
report four people for a party of four, preserve both reports (eight people),
allocate at most four canonical admissions, and flag the other report as a conflict.
This preserves ADR 0020's physical evidence without claiming the server prevented
the offline double entry. TICKET-173 owns transactional batch reconciliation.

Proposed event fields:

| Field                             | Contract                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| id / client_event_id              | Stable UUIDs; client event ID globally unique for retries.                                                                   |
| invitation_id                     | Nullable for unknown-token attempts; restrict deletion once referenced.                                                      |
| staff_id / device_id              | References stable identities; new events require both. Explicit legacy import may retain missing values.                     |
| reported_at / received_at         | Original device time and server receive time, kept separately.                                                               |
| reported_result / result          | Each one of valid, already_used, invalid, revoked, not_rsvped.                                                               |
| reported_people / admitted_people | Nonnegative integers; canonical admitted <= reported; positive canonical counts require valid result and a known invitation. |
| conflict                          | Records an offline/import discrepancy without deleting evidence.                                                             |
| source                            | online, offline or legacy; imports remain distinguishable from live authenticated scans.                                     |
| legacy_check_in_id                | Optional unique reference to the untouched historical record.                                                                |

The server compares immutable payloads before acknowledging a reused client event
ID: an identical retry is a no-op, a different payload is a conflict (TICKET-173).
A database unique constraint alone does not prove payload equivalence.

## Canonical counters and concurrency

One counter row per invitation stores accepted admissions and the corresponding
allowance. The allowance must come from the current locked RSVP, not the request.
A transaction locks the invitation/RSVP and counter consistently before allocating
seats. A database guard rejects counts beyond the authoritative allowance and RSVP
changes below already accepted admissions. The final SQL must prove this against
concurrent writers, not merely enforce admitted <= a freely writable snapshot.

Event records become append-only after backfill: reject UPDATE, DELETE and TRUNCATE
using the established RSVP-history trigger pattern. Restrictive references prevent
cascading deletion. Administrative retention requires a separately reviewed operation;
DDL-capable database administrators remain outside this append-only guarantee.

## Legacy preservation

Keep `check_ins` untouched. Import each historical row with its event ID, time,
staff/device identity and guest-to-invitation mapping. Missing identity stays missing
under the explicit legacy-import classification. Never synthesize an acting staff
member. Preserve reports beyond the RSVP allowance, but flag them and cap only the
canonical allocation. Order deterministic allocation by original time then event ID.

The bootstrap uses RSVP `status`; the current schema uses `attending` and
`count_attending`. The import must explicitly recognize and test both shapes. It
must not run the empty-scaffold-only 0001 migration over populated old rows.
Migration approval will distinguish this ticket's local preservation tests from any
future approval to upgrade an actual populated pre-0001 deployment.

## Generation and approval boundary

No migration has been generated for this ticket. PR84 currently owns migration 0011. Resolve its merge order before reserving this ticket's exact SQL/snapshot
paths. The expected sequence is expand, deterministic backfill, then append-only
and cross-table guards. An exact-path proposal will accompany generated SQL and
isolated test results; nothing authorizes production application or data deletion.
