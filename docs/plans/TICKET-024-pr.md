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
Cross-table guards, append-only triggers and deterministic backfill are SQL proposals
exercised in rolled-back temporary schemas. Final migrations, concurrency and
repeat-application checks remain incomplete.

# Verification

Earlier quick verification passed lint, types and 45 related tests (34 skips).
Four proposal guard tests passed together. Latest database run: three passed,
including both current/bootstrap populated preservation cases; three failed with
local CONNECT_TIMEOUT. No assertions or timeouts were relaxed. No full gate or
final migration verification is claimed. Logs and limitations are in the handoff.

# Risks and rollout

Do not deploy this draft. PR84 has merged migration 0011; integrate its develop base before generation. Applied migration
0001 is empty-scaffold-only and must not be applied to populated legacy rows.
The final proposal needs exact-path migration authorization and isolated evidence.
No production database action, RLS policy change or data deletion is included.

# Screenshots

N/A: backend schema and tests only; no UI changes.

# UI checklist

N/A: no rendered component or route is changed.

# Harness changes, if any

None. Existing isolation and protected-file guards remain enabled.

Latest checkpoint quick gate: lint, typecheck and 45 related tests passed; 38 opt-in tests skipped.
