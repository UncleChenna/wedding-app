# Ticket

Ticket: TICKET-172

# Summary

Staff authentication and admin provisioning need persistent credential lifecycle fields and stable device identities. This change adds unprovisioned staff PIN fields, revocation/version tracking, nullable staff email and a registered-device table while retaining existing staff and scan data.

# Changes

- Generate migration 0009 and corrective 0010 through Drizzle under explicit user authorization. Preserve applied 0009; 0010 corrects a PostgreSQL regex repetition bound discovered by real database testing.
- Enforce complete encoded credentials, expiry after issuance, positive credential versions and no admin PINs. Device IDs, names, roles and registering-staff references are constrained. RLS is enabled without browser access policies.
- Seed four unprovisioned staff and three deterministic devices; preserve current ordering fixtures.
- Add empty/bootstrap migration preservation tests. Integrated develop 0e6247c630c4d8962eb01b3c8bc2ef0817268e47.

# Acceptance criteria and evidence

All ticket criteria verified: seven staff/device database tests cover constraints, empty/bootstrap preservation, unchanged Auth links/emails/invitations/scans and RLS; eleven seed unit tests cover deterministic data with no raw/default PINs.

# Verification

- All 61 opt-in database tests pass, run individually with synthetic fixture cleanup between suites. Combined-suite attempts exposed pre-existing fixture coupling (singleton settings and seeded menu choices); failed logs retained and no assertions changed.
- Two migration runs have identical counts and eleven applied migrations. Two seed runs match exactly. A clean disposable database rebuild applies the full migration chain and reproduces those seed counts.
- RLS passes all fourteen public tables. Corrected quick gate passes lint/types/related tests.
- Full pnpm t:pr verification pending; this remains draft until that gate passes. Evidence: artifacts/TICKET-172/, docs/handoffs/TICKET-172.md, docs/reviews/TICKET-172/migration-approval.md.

# Risks and rollout

Only isolated local testing is authorized; no production migration has been performed. Deploy 0009 and 0010 together. Existing staff remain unprovisioned; format checks do not implement authentication. TICKET-031 owns hashing, sessions and authorization; TICKET-096 owns admin account/role provisioning; TICKET-024 owns legacy scan/device backfill. Roll back application code while retaining additive schema; no destructive down migration.

# Screenshots / UI checklist

N/A: no UI output changes. Existing device/performance release gates remain mandatory.

# Harness changes

None. Database test isolation limitation is disclosed above.
