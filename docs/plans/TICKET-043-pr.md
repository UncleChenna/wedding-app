# Ticket

Ticket: TICKET-043

# Summary

Adds administrator controls to revoke or reissue an invitation with confirmation,
while preserving the saved RSVP and explaining delayed offline propagation.
**Draft: remaining UI review evidence is still outstanding.**

# Changes

- Strict commands with expected status/version prevent stale administrative edits.
- Authenticated actions supply the audit actor; transactional service rotates the
  capability/version or revokes access and inserts a durable audit event atomically.
- Dedicated audit table definition excludes invitation capabilities and contacts.
- Gate-session-protected snapshot returns only invitation IDs, statuses and versions.
- Confirmation sheets in Admin Sharing; synthetic controls in /dev/share for review.
- Approved ADR0020 wording is retained: stale versions are “Replaced pass”. The
  dependent TICKET-065 retains actual offline scanner integration testing.

# Acceptance criteria and evidence

Pure version-transition, stale-form, signature/version snapshot, freshness and
safe-response tests pass. Action tests cover authorization and verified actor identity.
Four real PostgreSQL lifecycle tests pass. Authenticated mobile and desktop browser journeys pass with real local email OTP and TOTP, cancellation, reissue, old-link rejection, revocation, saved reply preservation and actor/time audit verification.

# Verification

- verify:quick: lint/types pass, 64 related tests pass, 53 skipped.
- Focused dev-server browser suite: 13 pass; four themes × 375/768/1280, axe AA,
  keyboard confirmation/Escape/focus return, 44px targets, overflow and session denial.
- 24 confirmation screenshots: docs/reviews/TICKET-043/screenshots.
- Five additional service-boundary tests pass (input rejection, bounded collision retries, unrelated failures).
- Four real database tests now pass on the approved isolated PostgreSQL instance.
- Migration repeat counts, seed repeatability and RLS on all 17 tables pass.
- Latest quick gate passes lint/types; its four opt-in DB cases are skipped by default,
  and were run explicitly with all four passing as recorded above.
- Full production verification on 495310f: 1044 unit passes / 95 skips; build passes;
  849 browser passes / 183 skips.
- Added authenticated lifecycle E2E: 2/2 pass on mobile and desktop; corrected
  strict fixture typing and reran typecheck successfully.
- Remaining visual inspection, load/CLS and applicable physical-device checks are
  not yet certified.

# Risks and rollout

The owner-approved migration adds only the RLS-enabled audit table. It has been
applied twice to this worktree's isolated database with identical counts. Seed
repeatability and RLS on all 17 tables pass. No production application is authorized.
Deploy the additive migration before consuming code; application rollback should
leave retained audit history intact. Offline scanners can accept old passes until
snapshot refresh under ADR0020. Physical-device and final UI review evidence remain outstanding.

# Review steps and screenshots

In this worktree, run pnpm dev and open /dev/share. Select each theme, try Revoke
invitation, cancel, then confirm and reissue. This preview changes synthetic state
only. Production controls require an authenticated administrator and migrated database.
See docs/reviews/TICKET-043/screenshots for confirmation captures.

# UI checklist

Focused automated preview checks pass as above. Full UI completion is not claimed;
remaining screenshot inspection, load/CLS and applicable device QA remain pending.

# Harness changes

None. TICKET-215 carries approval-workflow improvements separately.

# Approved base integration

Owner approved develop 5747c3d and its three unchanged protected migration
artifacts on 2026-11-05. Merge is conflict-free and blobs match exactly. Integrated
quick verification passes lint/types and 211 related tests (66 skipped). This does
not replace the separate migration/database verification recorded below.

# Audit migration review

The dedicated migration has now been generated locally through Drizzle, inspected,
and documented in `docs/reviews/TICKET-043/migration-approval.md`. It adds only the
RLS-enabled audit table, leaving existing table snapshots and journal entries
unchanged. The owner approved isolated testing and commit of all three generated outputs.
Migration/repeat counts, seed repeatability, all-table RLS, and four lifecycle database
tests now pass. The later authenticated browser tests used the owned local Auth, gateway and mail
services as well as PostgreSQL. Realtime and physical devices are not certified.

# Production UI evidence follow-up

Regenerated all 24 confirmation captures against the verified production build,
replacing earlier dev-server captures with a development error badge. All eight
new desktop-width captures inspected. Added axe scans of reissue states across
all themes/widths and /dev/share cold-load CLS checks at 375/768/1280. Focused
suite: 16/16 pass, with exact CLS=0 in the three default-theme load cases.
Final mobile/tablet capture inspection and authenticated page-load stability
remain outstanding; physical-device results are not certified.
