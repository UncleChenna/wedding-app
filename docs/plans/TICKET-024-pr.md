# Ticket

Ticket: TICKET-024

# Summary

Prepare invitation-level admission counters and immutable scan evidence while
retaining the historical guest-level check-in archive. This is an incomplete
design/implementation draft, not a deployable migration.

# Changes

- Proposed additive Drizzle tables for counters and scan events, with five result
  types, retry IDs, staff/device references and basic row constraints.
- Separate reported physical counts from canonical admissions so offline conflicts
  can be retained without exceeding the canonical allowance.
- Initial opt-in database tests for unknown invitations, retry uniqueness, immutable
  evidence, RLS and rejection of forged allowances/unsafe RSVP reductions.
- Storage contract and migration-preservation plan in docs/reviews/TICKET-024/.

# Acceptance criteria and evidence

No ticket acceptance criterion is complete. The old check_ins table is unchanged.
Cross-table counter guards, append-only triggers, deterministic legacy backfill,
complete preservation/concurrency tests and generated migrations remain to implement.
The schema declarations alone do not enforce these missing behaviors.

# Verification

Quick verification passes lint, types and 45 related tests (34 opt-in skips).
The first explicit database test attempt was refused by the managed-target guard
because local-stack setup had not completed; no database assertions ran. Both isolated startup attempts ended in failure. The ticket is blocked pending
stack health and migration-base integration. No full gate or migration preservation
result is claimed.

# Risks and rollout

Do not deploy this draft. TICKET-031's unmerged PR84 reserves migration 0011;
settle that integration before generating a competing sequence. Applied migration
0001 is empty-scaffold-only and must not be applied to populated legacy rows.
The final proposal needs exact-path migration authorization and isolated evidence.
No production database action, RLS policy change or data deletion is included.

# Screenshots

N/A: backend schema and tests only; no UI changes.

# UI checklist

N/A: no rendered component or route is changed.

# Harness changes, if any

None. Existing isolation and protected-file guards remain enabled.
