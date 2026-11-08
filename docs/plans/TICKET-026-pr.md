# Ticket

TICKET-026 — tickets/TICKET-026-rebuild-deterministic-seed-data-for-the-new-sche.md

# Summary

The old seed had no load profile or canonical admission evidence and seated guests
without setting their invitation's table. This adds repeatable default/load
profiles with complete household seating and explicit edge cases.

# Changes

- Default: 110 invitations, 249 guests, 28 tables; revoked/declined/partial/sold-out examples.
- Load: 185 invitations, exactly 350 named guests seated across all 30 tables.
- Historical check-ins have linked canonical scan evidence; runtime guards stay enabled.
- Explicit timestamps and strict CLI profile validation before local reset.
- Usage: `pnpm db:seed` or `pnpm db:seed --profile load`.

# Acceptance criteria and evidence

- Repeated persisted row hashes match for every public table in both profiles (2 DB tests).
- Exactly 350 guests on 30 tables and consistent household seating (unit tests).
- All required edge cases present (unit tests); canonical partial counts verified in DB.
- Full gate pending; draft until verification completes.

# Verification

20 fixture/CLI tests pass. Quick lint/types/related tests passed; normal commit hooks
passed on e0046c1. Migration repeat preserved all counts and 19 migration records;
20 tables retain RLS. The opt-in persisted-row suite passed 2 tests in 2.94 seconds,
including enabled-trigger and bounded-counter assertions. Independent review found
no blocking defects. See docs/handoffs/TICKET-026.md.

Separate CLI default seed and full verification remain pending while local VM
capacity is constrained. These are not claimed successful. Base: develop407fb68.

# Risks and rollout

Seeding replaces disposable local fixtures only. Existing identity checks and
transactional named-trigger restoration remain enforced. No migration, dependency
or production database change. Revert this PR to restore the old fixture generator.

# Screenshots

N/A: database fixtures and CLI only, no UI changes.

# UI checklist

N/A: no UI, theme or QR rendering changes. Full verification remains pending.

# Harness changes, if any

None. Seed CLI rejects malformed profile arguments before reset.
