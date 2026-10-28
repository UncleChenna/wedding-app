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

## 2026-10-28 — resumed from committed migration evidence

Authoritative branch/PR inspection found migrations already generated, committed and pushed in e72852a on 27 October; ignored exact-path approval record exists. CI40519769549 passed all required jobs on that commit. The previous approval-blocked ledger/handoff was stale. CLI resumed this claimed ticket in 2a6d462. Base develop is 763430841153fe7b8fdba68594e0b4af54d56adc. No generated artifact or schema was edited during this resumed verification.

Stopped completed TICKET-006 stack with backup retained before starting this ticket to avoid the verified Docker memory problem. TICKET-025 startup passed. Two guarded migrations exited0 with identical complete counts: four applied migrations, 12 public tables; RLS enabled on all12. Counts: check_ins30, event_settings0, guests248, invitations110, menu_items16, order_items36, orders18, rsvp_changes0, rsvps85, staff4, tables28, themes4.

The initial opt-in run exposed an incorrect raw Postgres date expectation (Date versus string); corrected the assertion to the exact Date value. Added a real Drizzle-backed getEventSettings regression covering both unset defaults and stored time/date/time-zone/cutoff fields inside a rolled-back transaction. All21 targeted tests passed (15 unit +6 database). Runtime-role mutation grants and update/delete/truncate rejection passed. Two deterministic local seeds yielded identical complete counts; all6 database cases passed again after reseeding, proving the history trigger was re-enabled. No fixture transaction data persisted.

Quick gate passed lint/types; its6 opt-in skips are not counted as database verification. Full t:pr verification remains the next gate. No production execution, RLS policy addition, history purge or schema change was performed in this verification session. PR44 remains draft until that gate succeeds; after review, the human merges and the CLI records done. TICKET-012 and other dependents must wait for confirmed merge/completion.
