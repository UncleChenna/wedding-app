# Ticket

Ticket: TICKET-023

# Summary

The scaffold puts a QR token on each guest and stores RSVP as a status enum. The PRD requires invitation-level identity and an explicit attendance count. This change supplies that database contract and removes guest QR tokens.

# Changes

- Invitation token generated with 256 cryptographic random bits for application inserts; database enforces unique, non-null, URL-safe token format. Explicit status, token version, table, side, and 0–10 tag-along capacity with default one.
- Named guests with optional E.164 phone, meal and dietary details; RSVP attendance/count consistency, one response per invitation and a response timestamp.
- Drizzle-generated migration and snapshot; RLS unchanged. Eight real database regression cases, minimal seed compatibility updates and ADR 0017.

# Acceptance criteria and evidence

Migration applied twice on the isolated empty database; table counts and migration count unchanged on the second run. Eight real PostgreSQL constraint tests pass, including token uniqueness/null/length, capacity bounds, valid statuses/versions/references, guest names/phone, RSVP uniqueness/count/time and removal of guest QR tokens. All ten tables retain RLS.

# Verification

- Initial six tests fail on old schema, pass on new schema; expanded eight pass.
- One expanded run timed out connecting; healthy-container and host checks preceded the successful retry without changing timeouts.
- Five seed tests pass; local seed produces 248 guests across 110 invitations.
- Quick gate passes. The earlier full gate stopped on missing exact-path authorization (three hook tests failed, 268 passed, eight DB-only tests skipped). The user has now approved the generated paths; final integrated verification is pending.
- Production build passed; browser suite passed 163 tests with 17 existing conditional skips. This is unfinished and must remain a draft until final verification passes.

# Risks and rollout

**Empty prelaunch scaffold only.** The generated SQL renames compatible fields but does not backfill existing names, RSVP status or seat capacities. Do not deploy to a populated guest database; prepare a separate data-preserving migration first. No production database was touched. Restore a backup with the previous application version to roll back; no destructive down migration is supplied. Token issuance/revocation endpoints and atomic cross-row capacity validation remain downstream tickets.

# Screenshots and UI checklist

Not applicable: no UI, tokens, routes, layout, motion, QR rendering or copy changes.

# Harness changes

No hooks, checks or CI configuration changed. Database regressions explicitly opt in with RUN_INVITATION_DB_TESTS=1, verify the managed local database address and roll back fixtures. The normal unit gate is not evidence that DB constraints ran.
