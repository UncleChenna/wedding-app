# TICKET-175 photo storage migration

Base: develop c9c9e66010ee773189477139d4f8b0d30cf481e1.

Generated files explicitly approved by the user for commit and the authorization record on 2026-11-06:

- `drizzle/0013_invitation-photos.sql`
- `drizzle/meta/0013_snapshot.json`
- `drizzle/meta/_journal.json`

The additive migration creates `invitation_photos` with RLS enabled and no policies.
It does not alter existing rows, tables or policies. The table has sixteen numbered
slots, unique opaque UUID references, canonical WebP bytes (at most 4 MiB each),
dimensions (at most 2560 each), a bounded blur placeholder, uploader UUID and timestamp.
Slot constraints cap canonical image storage at 64 MiB, excluding database overhead,
thumbnails and backups. A transaction-scoped advisory lock serializes slot allocation.
When full, the application refuses another upload rather than deleting existing photos.

PostgreSQL storage fits this small private gallery and keeps assets in the existing
database backup boundary. This is not a general media library: future growth requires
an explicit storage redesign. No new service, credential, account or bucket is added.
Supabase clients cannot read or write these rows directly. Only server-side Drizzle
uses the table, after live allowlist and two-step admin authorization.

The first generated SQL truncated a literal containing a semicolon. It was never
applied. Following explicit exact-path cleanup approval, only the two untracked
generated files were removed and the journal restored to branch HEAD. The corrected
schema uses `chr(59)`; Drizzle regenerated the SQL without manual migration edits.

Local verification: both migration applications passed; row and migration counts
match exactly; all 17 public tables retain RLS. The rollback-only integration test
passes for normalized-byte round-trip, EXIF removal/orientation, gallery quota and
anonymous read denial. Quick verification passes lint, types and related tests.
Full verification passes:1054 unit tests and837 browser tests, plus formatting/lint/types/build. No production application is authorized.
Other draft branches also use migration index 0013; integration requires
reviewing the then-current develop journal before merging, never rewriting an applied
migration. Application rollback may leave this unused additive table intact; deleting
it or its assets requires separate data-deletion authorization.
