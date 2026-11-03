# TICKET-172 migration proposal — updated 2026-11-03

Status: source prepared; generated migration not authorized, generated or applied.

## Exact protected outputs

After approval, run pnpm db:generate --name staff-device-identities after integrating develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1 (journal idx8):

- drizzle/0009_staff-device-identities.sql
- drizzle/meta/0009_snapshot.json
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

Develop now includes migrations through 0008_ordering-contract. The old 0002 proposal is superseded and must not be used. Merge one migration branch at a time; if numbering advances again, revise the exact-path proposal before generation. Do not manually merge journal/snapshot JSON or reuse stale approval.

Rollback application code while retaining additive fields/table; old code ignores them. No automatic destructive down migration. RLS remains enabled throughout. Do not reset a populated guest DB or another worktree.

## Unchanged develop files requiring carry-forward authorization

The read-only merge preview against f5e5db58446363c6a0b4998dea3dbdfa603a43c1 produces byte-identical copies of these 17 protected files from develop. No generated migration was created or applied. The current branch has not been merged yet; scripts/seed.ts and scripts/**tests**/seed-data.test.ts need integration resolutions that retain both ordering seeds and the proposed unprovisioned staff/devices.

- `drizzle/0002_event-settings-rsvp-history.sql`
- `drizzle/0003_rsvp-history-append-only.sql`
- `drizzle/0004_furry_wolfpack.sql`
- `drizzle/0005_blue_ravenous.sql`
- `drizzle/0006_ordering-expand.sql`
- `drizzle/0007_ordering-backfill.sql`
- `drizzle/0008_ordering-contract.sql`
- `drizzle/meta/0002_snapshot.json`
- `drizzle/meta/0003_snapshot.json`
- `drizzle/meta/0004_snapshot.json`
- `drizzle/meta/0005_snapshot.json`
- `drizzle/meta/0006_snapshot.json`
- `drizzle/meta/0007_snapshot.json`
- `drizzle/meta/0008_snapshot.json`
- `drizzle/meta/_journal.json`
- `pnpm-lock.yaml`
- `src/modules/theming/themes/theme.schema.json`

Authorize recording these exact paths in `.worktrees/TICKET-172/.harness/approved-writes.json` solely to commit unchanged develop files after integration. The separate proposed 0009 outputs above need authorization for generation, isolated testing and commit. No production application, reset of populated data, new browser policy or credential provisioning is requested.

## Corrective migration request — 2026-11-03

0009 was authorized, generated and applied to this ticket's isolated database. The real-Postgres valid-hash test exposed an invalid repetition bound in the constraint: `{64,256}`. Proposed schema replacement: `([0-9a-f]{2}){32,128}`. This represents 32–128 digest bytes and fits PostgreSQL repetition bounds. No applied SQL will be edited.

Requested exact outputs: `drizzle/0010_staff-pin-envelope-fix.sql`, `drizzle/meta/0010_snapshot.json`, `drizzle/meta/_journal.json`, generated through Drizzle after correcting `src/modules/shared/server/db/schema.ts`. Record approved paths in `.worktrees/TICKET-172/.harness/approved-writes.json`. Isolated testing and commit only. Automatic approval review rejected execution pending this explicit extension; no correction has been executed yet.

## Corrective approval received

User approved the schema correction, exact 0010 outputs and authorization record. 0010 was generated through Drizzle and applied only to the isolated ticket database. Seven staff/device database tests pass; original 0009 stays unchanged. Reapplication keeps eleven migration records and identical counts. RLS passes all fourteen public tables.
