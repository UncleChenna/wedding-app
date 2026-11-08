# TICKET-026: rebuild deterministic seed profiles

The old seed had no load profile or canonical admission evidence and seated guests
without setting their invitation's table. This change adds default and load
profiles, complete household seating and explicit edge cases.

## Changes

- Exactly 350 named guests seated across 30 tables in the load profile.
- Revoked, declined, partially admitted and sold-out default examples.
- Canonical scan evidence for archived check-ins, preserving runtime guards.
- Explicit fixture timestamps and opt-in persisted-row hash verification.
- Strict `--profile default|load` argument validation before a local reset.

## Verification and remaining work

20 fixture/CLI tests pass; quick lint/types and related tests passed before the
latest load-seating assertion. Database startup and persisted hash verification,
full verification and independent review remain pending. This is a draft, not
release or completion evidence.

## Risks and rollback

Seeding replaces disposable local fixtures only. Existing target identity checks
and transactional named-trigger restoration remain enforced. No migration,
dependency, production database or application UI change. Revert this PR to
restore the previous fixture generator.

Ticket: tickets/TICKET-026-rebuild-deterministic-seed-data-for-the-new-sche.md.
