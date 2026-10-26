# Ticket

Ticket: TICKET-023

# Summary

The scaffold puts a QR token on each guest and stores RSVP as a status enum. The PRD requires invitation-level identity and an explicit attendance count. This change supplies that database contract and removes guest QR tokens.

# Changes

- Application inserts create invitation tokens using 256 cryptographic random bits; database enforces unique, non-null, URL-safe token format. Explicit status, token version, table, side, and 0–10 tag-along capacity with default one.
- Named guests with optional E.164 phone, meal and dietary details; RSVP attendance/count consistency, one response per invitation and a response timestamp.
- Drizzle-generated migration and snapshot; RLS unchanged. Eight real database regression cases, minimal seed compatibility updates and ADR 0017.

# Acceptance criteria and evidence

Migration applied twice on the isolated empty database; table counts and migration count unchanged on the second run. Eight real PostgreSQL constraint tests pass, including token uniqueness/null/length, capacity bounds, valid statuses/versions/references, guest names/phone, RSVP uniqueness/count/time and removal of guest QR tokens. All ten tables retain RLS.

# Verification

- Initial six tests fail on old schema, pass on new schema; expanded eight pass.
- One expanded run timed out connecting; healthy-container and host checks preceded the successful retry without changing timeouts.
- Five seed tests pass; local seed produces 248 guests across 110 invitations.
- Quick gate passed. Hosted `pnpm verify` passed on integrated commit 4f93490 (run 40411115916): production build and 167 browser tests passed, 17 conditional skips. The standard unit suite skips the eight opt-in DB cases; their separate successful run is recorded in the database evidence.
- Hosted migrations + seed, ticket validation and PR-text checks passed. Earlier missing-approval failures were resolved by the user's exact-path authorization, without changing hooks.
- Database counts and constraint evidence: `docs/reviews/TICKET-023/README.md`.

# Risks and rollout

**Empty prelaunch scaffold only.** The generated SQL renames compatible fields but does not backfill existing names, RSVP status or seat capacities. Do not deploy to a populated guest database; prepare a separate data-preserving migration first. No production database was touched. Restore a backup with the previous application version to roll back; no destructive down migration is supplied. Token issuance/revocation endpoints and atomic cross-row capacity validation remain downstream tickets.

# Screenshots

Not applicable: no UI, tokens, routes, layout, motion, QR rendering or copy changes.

# UI checklist

Not applicable to this schema-only change; no rendered interfaces changed. Full browser regression checks passed as recorded above.

# Harness changes

No hooks, checks or CI configuration changed. Database regressions explicitly opt in with RUN_INVITATION_DB_TESTS=1, verify the managed local database address and roll back fixtures. The normal unit gate is not evidence that DB constraints ran.
