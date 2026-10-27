# TICKET-172 migration proposal — 2026-10-27

Status: source prepared; generated migration not authorized, generated or applied.

## Exact protected outputs

After approval, run pnpm db:generate --name staff-device-identities against this branch's journal (currently idx1):

- drizzle/0002_staff-device-identities.sql
- drizzle/meta/0002_snapshot.json
- drizzle/meta/_journal.json

Record authorization only if explicitly approved, in .worktrees/TICKET-172/.harness/approved-writes.json with a future expiry. Approval is for local generation/testing/commit, not production deployment or data deletion. Use generators for all three files.

## Concrete source change to review

src/modules/shared/server/db/schema.ts defines:

- Staff email becomes nullable, preserving uniqueness for non-null values and all existing IDs.
- Optional pin_hash, pin_issued_at and pin_expires_at must either all be null or form a complete encoded scrypt credential with expiry after issuance. Admin rows cannot hold PIN credentials.
- Positive credential_version defaults to 1; revoked_at supports disabling an identity. Existing bootstrap staff receive no PIN and no activation.
- New registered_devices table has stable text primary keys (UUID default, legacy-safe identifier format), nonblank display name, gate/kitchen/bar role, registering staff FK, registration/revocation timestamps and updated_at. RLS enabled; no browser policies or new grants.
- check_ins is unchanged: existing text device IDs and staff references survive. TICKET-024 owns scan schema migration and any legacy registration backfill/FK enforcement. Device IDs are not secrets and are never sufficient for authorization.
- Seeds define three named stable devices matching existing seeded scans and explicitly unprovisioned staff credentials. There is no raw or usable default PIN.

The scrypt envelope constraint rejects plain PIN storage and malformed envelopes; it is not proof of cryptographic strength or correctness. TICKET-031 must implement salted hashing, safe parameter bounds, constant-time comparison, rate limits, role checks, credential-version/revocation checks and timezone-aware expiry provisioning. No login is enabled by this change.

## Evidence already available

Five real-Postgres tests failed on missing columns/table against this exact isolated pre-change database. Seven seed tests pass, including no default PIN and device references for every seeded scan. Quick lint/types/related-test gate passes, but its skipped DB cases are not DB validation. Baseline: ten public tables empty and two applied migrations. No generated output or DB schema has been mutated.

## Required after approval

Inspect generated SQL for additions/nullability only; reject drops or destructive casts. Prove both empty DB migration and preservation of an existing bootstrap fixture (staff with email/Auth link, invitations and scan rows); compare migration/table counts before and after second application. Run all five new DB regressions plus existing invitation regressions, verify RLS, repeat deterministic seeding/counts, and run full pnpm verify. No successful migration/constraint claim is made yet.

## Coordination / rollback

TICKET-025 also awaits migration approval against idx1. Merge one migration branch at a time; the later branch must be regenerated from current develop with revised exact-path authorization. Do not manually merge journal/snapshot JSON or reuse stale approval.

Rollback application code while retaining additive fields/table; old code ignores them. No automatic destructive down migration. RLS remains enabled throughout. Do not reset a populated guest DB or another worktree.
