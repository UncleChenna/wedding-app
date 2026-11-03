# TICKET-172: staff identities and device registrations

Prepare staff credential lifecycle fields and stable registered-device identities for staff sign-in and admin provisioning. **Draft: one real database test fails; do not merge.**

## Changes

Integrated develop 0e6247c630c4d8962eb01b3c8bc2ef0817268e47, retaining ordering and staff/device seed contracts. Generated approved 0009 through Drizzle: nullable staff email, unprovisioned PIN fields, credential version/revocation and device registry with RLS and no browser policies. No usable default PINs.

## Verification and acceptance evidence

- Eleven seed tests pass.
- Quick gate passes lint, types and 670 related tests; 49 conditional tests skipped.
- Five real database constraint tests fail before migration as expected. After migration, six of seven tests pass; this is not a green database gate.
- Empty/bootstrap preservation tests pass, retaining staff email/Auth links, invitation and historical scan values.
- Two migration runs retain identical row counts and ten applied migration records. RLS passes all 14 public tables.
- Valid encoded PIN test fails because PostgreSQL rejects regex repetition `{64,256}`. Proposed correction uses byte pairs `([0-9a-f]{2}){32,128}`. Applied 0009 stays unchanged; generated 0010 requires pending exact-path approval.

## Remaining work

Generate authorized corrective 0010, rerun real database constraints, repeat migration/seed counts, run invitation regressions and full pnpm verify. Acceptance criteria remain incomplete. No UI changes; device and performance release gates remain in their existing tickets.

## Review and risks

See docs/reviews/TICKET-172/migration-approval.md and docs/handoffs/TICKET-172.md. Isolated local application only; no production authorization. Hash-envelope constraints do not implement authentication: TICKET-031 owns safe hashing and role/session enforcement; TICKET-096 owns admin provisioning. TICKET-024 owns legacy scan backfill. Roll back application code while retaining additive schema; no destructive down migration.
