# Ticket

Ticket: TICKET-172

# Summary

Prepare staff credential lifecycle fields and stable registered-device identities needed by staff sign-in and check-in. This draft deliberately has no generated migration yet; exact-path approval is pending.

# Changes

Nullable encoded PIN hash/issued/expiry fields with completeness/expiry/admin-role checks; positive credential version and revocation timestamp. Optional email supports PIN-only staff. Device registry retains text identifiers compatible with legacy scan IDs and has a registering-staff FK, role/name/ID constraints and RLS enabled without policies. Deterministic seeds provision no usable or raw PIN and define named devices for seeded scans.

# Acceptance criteria and evidence

Schema and seed source prepared. Seven seed tests pass. Five real database regressions fail on missing fields/table before migration, as expected. Migration, real constraint success, bootstrap-data preservation and repeatability remain incomplete.

# Verification

Quick lint/types/related-test gate passes. Opt-in DB tests are not counted as passing: the explicit run had five expected pre-migration failures. Isolated baseline is ten empty tables and two applied migrations. Full gate not run; schema/migration drift is expected until approved generation.

# Risks and rollout

[Exact migration approval proposal](https://github.com/UncleChenna/wedding-app/blob/TICKET-172/docs/reviews/TICKET-172/migration-approval.md). No production deployment/data deletion authorized. Hash format validation is not hashing/authentication; TICKET-031 handles strength, comparison, expiry and sessions. TICKET-024 owns legacy scan/device backfill and FK conversion. TICKET-025's pending migration numbering must be reconciled by regeneration, not manually editing snapshots. Rollback app code while keeping additive schema; destructive down migration requires separate authorization.

# Screenshots / UI checklist

N/A: schema and seed work only.

# Harness changes

None. Draft remains unmergeable until generation, DB evidence and all gates are complete.
