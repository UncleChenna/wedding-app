# Ticket

Ticket: TICKET-043

# Summary

Adds administrator controls to revoke or reissue an invitation with confirmation,
while preserving the saved RSVP and explaining delayed offline propagation.
**Draft: database migration and integration verification are outstanding.**

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
All ticket acceptance criteria remain unchecked pending real database integration.

# Verification

- verify:quick: lint/types pass, 64 related tests pass, 53 skipped.
- Focused dev-server browser suite: 13 pass; four themes × 375/768/1280, axe AA,
  keyboard confirmation/Escape/focus return, 44px targets, overflow and session denial.
- 24 confirmation screenshots: docs/reviews/TICKET-043/screenshots.
- Five additional service-boundary tests pass (input rejection, bounded collision retries, unrelated failures).
- Four real database tests are written/typechecked but not run: base migration exited 1 first.
- Full production verification, authenticated lifecycle E2E, transaction rollback and
  concurrency, migration/RLS checks, Lighthouse and physical phones remain unverified.

# Risks and rollout

Do not merge/deploy yet: the service references a new audit table whose migration
has not been generated. PR89 is merged. The owner-approved develop base 5747c3d is integrated, including its unchanged migration0012; the audit migration can now follow it.
Isolated database startup recovered, but base migration exited 1 with only 119 MB VM memory available. The owned stack is stopped with backup preserved. No production database changes are authorized.
Offline scanners can accept an old pass until their snapshot refreshes under ADR0020.
Migration rollback/rollout instructions will be completed alongside generated SQL.

# Review steps and screenshots

In this worktree, run pnpm dev and open /dev/share. Select each theme, try Revoke
invitation, cancel, then confirm and reissue. This preview changes synthetic state
only. Production controls require an authenticated administrator and migrated database.
See docs/reviews/TICKET-043/screenshots for confirmation captures.

# UI checklist

Focused automated preview checks pass as above. Full UI completion is not claimed;
production performance, device QA and authenticated database journeys remain pending.

# Harness changes

None. TICKET-215 carries approval-workflow improvements separately.

# Approved base integration

Owner approved develop 5747c3d and its three unchanged protected migration
artifacts on 2026-11-05. Merge is conflict-free and blobs match exactly. Integrated
quick verification passes lint/types and 211 related tests (66 skipped). This does
not certify database integration or the still-missing audit migration.
