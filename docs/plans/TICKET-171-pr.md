# Ticket

Ticket: TICKET-171

# Summary

Prepare menu categories and station order projections so one guest submission can contain kitchen and bar items while counting once for table limits. This draft contains source schema and deterministic seed changes; migration and real-database verification remain unfinished.

# Changes

- Canonical meal/soft_drink/alcohol category column with legacy category retained; bounded per-item cap and existing live availability.
- Unique client request ID on the submission; station child rows with unique submission/station and queue index.
- Line-item composite FK prevents attaching a child from another submission; quantity snapshots and uniqueness support cap checks.
- Deterministic mixed-station seed with matching lines, separate child statuses and no quantity duplication.

# Acceptance criteria and evidence

Source implementation only. Three new behavior tests failed before changes; all eight seed tests now pass. Quick lint/types/related tests pass. No claim of successful migration, SQL constraints, idempotent writes or existing-data preservation.

# Verification

pnpm test scripts/**tests**/seed-data.test.ts: eight pass. pnpm verify:quick passes. Real DB tests, staged migration generation, populated bootstrap preservation, RLS, seed repeatability and full gate are outstanding. Schema/migration drift is expected in this draft.

# Risks and rollout

Not ready to merge. Expand/backfill/contract migration must preserve old rows/IDs, reject ambiguous drink mapping and duplicate legacy lines, and avoid silently clipping historical quantities. No generated paths or production/data deletion authorized. Pending TICKET-025/TICKET-172 migrations also use journal idx1 and require sequential regeneration. Application transaction enforcement remains in TICKET-074; cap snapshots cannot be trusted from clients.

# Screenshots / UI checklist

N/A: data model and seed code only.

# Harness changes

None. Review the dated plan and per-ticket handoff for exact next steps and known limitations.
