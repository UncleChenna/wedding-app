# Ticket

TICKET-175 — Validate and store invitation photo uploads. Target develop.

# Integration status

Implementation and full verification are published. PR remains draft because develop
advanced to6fb46534 with TICKET-084's migration0013. Photo migration metadata now
conflicts. Proposed base update and generator reconciliation are documented in
docs/reviews/TICKET-175/base-update-proposal.md and await explicit approval.
The passing checks below establish the original base, not the unresolved integration.

# Summary

The future invitation editor needs a safe, private photo pipeline. Admins can now
submit actual JPEG/PNG/WebP bytes, receive an opaque image reference with dimensions
and a blur placeholder, and retrieve the normalized WebP through an independently
authorized endpoint. Original files, filenames and EXIF are not stored.

# Changes

- Approved exact sharp0.35.5 runtime dependency; no build-script permissions changed.
- Bounded real decoding, container validation, orientation correction, metadata
  removal, canonical WebP output and a small blur thumbnail.
- POST /api/admin/photos requires live allowlisted AAL2 identity before reading the
  body, same-origin requests, supported MIME and an actual streamed 8MiB ceiling.
- Private GET /api/admin/photos/<id> independently checks identity, rejects external
  URLs and uses no-store/nosniff responses.
- Additive RLS-enabled invitation_photos table. Sixteen slots cap canonical image
  storage at64MiB, plus thumbnails/database overhead. Transaction-serialized slot
  allocation refuses full storage without overwriting or deleting photos.
- Documented access, retention, backup scope and future editor/publication boundary.

# Acceptance criteria and evidence

- Admin-only validation:22 decoder/upload cases and7 private-delivery cases pass.
- Controlled storage: database round-trip, orientation/EXIF removal, gallery quota
  and anonymous read denial pass; mobile/desktop real OTP/TOTP upload journeys pass.
- Storage access/retention is documented; the user approved all three generated
  migration paths and the authorization record. No existing RLS policy changed.

# Verification

- Full pnpm verify passes: formatting, lint, types,1054 unit tests (97 opt-in skips),
  production build,837 browser tests (189 intentional skips). Log:
  /tmp/TICKET-175-approved-verify.log. Earlier hook failures were caused by pending
  authorization and cleared after the approved record was written; no hook was changed.
- Two isolated migration applications pass with matching counts; all17 tables retain
  RLS. Explicit photo database integration and2 authenticated browser tests also pass.

# Review

Read docs/reviews/TICKET-175/storage-contract.md and migration-approval.md.
In an isolated managed checkout, apply the approved migration and build; run
RUN_PHOTO_DB_TESTS=1 pnpm exec vitest run scripts/**tests**/photo-upload.integration.test.ts
and pnpm exec tsx scripts/test-photo-upload.ts. The browser runner creates unique
local test identities; it does not modify the persistent admin allowlist.

# Risks and rollout

No production database application is authorized. Other draft branches have migration
index0013; reconcile the current develop journal before integration, never rewriting
an applied migration. Rollback can leave this unused additive table intact; deleting
rows/table needs separate authorization. Database backups include photos and uploader
UUIDs. Retention is documented but automatic deletion is not implemented here.

Strict container validation and canonical re-encoding reduce polyglot risk; this is
not a claim to detect every possible polyglot. A lost successful response can leave
an unused slot because retries are not deduplicated. When full, operators must
review assets for separately authorized cleanup. Guest publication/editor integration
belongs to TICKET-099/178; unpublished images remain private.

# Screenshots and UI checklist

No new user interface; no theme, CI, hook, native build permission or existing RLS
policy changes.

# Harness changes, if any

None. Existing verification and protected-file checks remain unchanged.
