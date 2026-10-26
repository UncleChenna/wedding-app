# TICKET-023 database evidence — 26 October 2026

Isolated local project: wedding-13b237dc87ea. No production database operations.

## Migration

Drizzle generated 0001_invitation-rsvp-model.sql and its snapshot/journal. SQL SHA-256: `28443cd8d1e623ba79c63809ac7c7ecd79de79ff57606f4739448771f48d6efb`. The original migration was not edited. Baseline had zero rows in all ten application tables and one applied migration.

`pnpm db:migrate` followed by `pnpm db:counts` ran twice. [First counts](after-first-migration.txt) and [second counts](after-second-migration.txt) are identical, including two applied migrations. `pnpm db:check-rls` confirmed all ten public tables retain RLS. A later `pnpm db:generate --name drift-check` reported no schema changes.

## Real constraints

`RUN_INVITATION_DB_TESTS=1 pnpm test scripts/__tests__/invitation-schema.integration.test.ts`: six original failures against the old schema; six passes after migration. The expanded suite passed all eight cases. The tests verify the managed local address and roll back their fixtures. Coverage includes defaults, token uniqueness/null/length, capacity boundaries, RSVP uniqueness/attendance, phone/name validation, token versions/status/table references, response timestamps and absence of guest QR tokens.

One intervening connection attempt timed out before tests ran. The unchanged test suite passed after the host connection recovered; no timeout was increased. Standard unit runs skip these eight opt-in database tests and are not database evidence.

## Seed compatibility

Five deterministic seed tests pass. `pnpm db:seed` succeeded with 110 invitations and 248 guests; [all counts](seeded-counts.txt). TICKET-026 retains the broader seed redesign. A later migration on this seeded database succeeded, but its following counts query timed out, so that extra comparison is not claimed as verified.

## Limits

This is an empty-scaffold migration, explicitly approved on that basis. It does not backfill a populated old guest database. See ADR 0017 for deployment and rollback limits. Full gate and browser results are recorded in the handoff.
