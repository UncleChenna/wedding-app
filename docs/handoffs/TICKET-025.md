# TICKET-025 — 27 October 2026

Owner divine; agent codex; branch TICKET-025; base dc31f20756eddff4b9744c3fbbd7c99a4a798fa9. TICKET-036 PR42 merged after all required checks and is recorded done. Its isolated stack was stopped with backup=true before starting this one.

## Current state

Managed project wedding-c4ce5584db6b, database 27641, app 27650, browser 27651. Setup and existing migrations passed. Ticket claimed and moved to in_progress through the CLI. Plan: docs/plans/2026-10-27-TICKET-025.md.

Implemented typed settings validation, immutable approved draft defaults and a typed read helper. Venue/time/time zone/map/dress/cutoff remain null, ordering closed. Operational order limits are provisional defaults, not enabled features. Fifteen tests first failed on missing modules then passed. No schema or migration changes yet; no ticket acceptance criterion is complete.

The shell hook misread multiline write content as shell syntax. Fully quoted python -c with explicit paths worked without hook changes. Use proper shell quoting; do not disable the guard.

## Next

Write real-database failing tests, add singleton event_settings and rsvp_changes schema, wire the Drizzle accessor, and generate migrations through Drizzle. Custom generated SQL should reject update/delete/truncate and revoke those runtime grants; no cascade that silently loses history. Document deliberate privileged retention maintenance for TICKET-127. Preserve RLS without adding browser policies.

Apply twice and compare all counts, check RLS and seed repeatability, then quick/full verification. Prepare exact generated paths and reviewable SQL before requesting any protected-file authorization. TICKET-023 approval does not cover this migration. Push all work; retain a draft PR while incomplete. Do not change another owner's TICKET-204.

## Migration approval blocker

Schema source and Drizzle accessor are now prepared. Five real database regressions fail on the old schema (missing tables); 15 defaults tests and source typecheck pass. Quick gate passes but its seven opt-in DB tests skip; it is not migration evidence. No generated files or database changes have been made.

Automatic approval review rejected migration generation because only TICKET-023 paths were approved. Prepared docs/reviews/TICKET-025/migration-approval.md with exact five generated paths, custom append-only SQL, constraints, grants, retention implications and rollback. The installed generator confirms custom migrations also write snapshots. Approval must cover generation, filling only the new custom SQL, and recording it in this worktree's ignored .harness/approved-writes.json. Never reuse prior ticket approval or manually alter generated snapshots.

Next after approval: generate 0002 table migration and 0003 custom migration, inspect/apply twice, compare counts, check all 12 tables' RLS and role grants, run five regression cases and configured accessor tests, seed twice and full verification. PR44 stays draft until complete. Schema source ahead of migration is deliberately incomplete; CI drift may fail until generated files are authorized.
