# TICKET-175 handoff — 2026-11-06

Owner divine; agent codex; branch TICKET-175. Base develop
c9c9e66010ee773189477139d4f8b0d30cf481e1. Scope: admin-only validated image upload,
canonical image/blur generation, controlled storage reference and retention docs.

The user approved stopping idle TICKET-166's wedding-cb98dc8b6300 stack with backup
preserved. Supabase returned exit0 and backup:true. No other stack was stopped.
TICKET-166 remains blocked on its distinct device-review decision, not capacity.
Its CI run42280374422 still had verification running when last checked.

Claimed175 through the ledger and created its managed worktree from fetched develop.
Locked installation, shared skill links, isolated Supabase startup and existing
migrations all succeeded. Project wedding-0c649f187525, port base23440, app23450,
browser23451. Start/status pushed as f116c16. Environment is now isolated; do not
print credentials. No test fixtures or seed data created yet.

Read ticket/board/roadmap, PRD ADM-5 and architecture/data rules. Prepared dated plan
and dependency proposal. Installed Next's transitive sharp0.35.5 loads successfully.
Direct dependency is NOT added: requested explicit native-dependency approval plus
generated pnpm-lock.yaml and exact-path authorization record. Request unanswered.
No native build-script permission change is proposed. The initial package.json
subpath lookup was blocked by package exports; runtime versions confirms0.35.5.

Next: resolve decoder approval; write failing real-byte fixture tests and implement
bounded canonical decoding. Prepare storage/access/retention design before any
schema or policy change. Do not substitute signature-only checks for decoding or
claim arbitrary polyglot detection. All acceptance criteria remain unverified.
No product code, dependency, schema, RLS, CI or production change yet.

## Approved decoder implementation — 2026-11-06

Draft PR: https://github.com/UncleChenna/wedding-app/pull/107. User explicitly
approved sharp0.35.5, generated pnpm-lock.yaml and its authorization record. Recorded
the exact path in ignored .harness/approved-writes.json and ran pnpm add with the
exact version. No native build-script permissions, CI, RLS or services changed.

Added internal server-only normalizePhoto: strict complete-container checks for
JPEG/PNG/WebP; actual bounded Sharp decoding; MIME/dimension/frame/input limits;
auto-orientation; metadata-free canonical WebP and a bounded blur thumbnail. Rejects
appended/concatenated payloads, unknown PNG/WebP chunks and animation containers.
Canonical re-encoding is essential: structural checks alone are not a proof that
all conceivable polyglots are detectable. No original bytes are returned for storage.

Tests first failed for the missing implementation. The initial ten cases passed;
strict types then caught a fixture tuple's possibly undefined width, fixed with
readonly tuples. Added progressive-JPEG and animated-WebP tests. Identical animation
frames were optimized into one frame; corrected the fixture to distinct pixels.
Final verify:quick passes lint/types/all12 related tests; log
/tmp/TICKET-175-image-quick-final.log. Full verification has not run.

Next: authorization boundary and persistence design/integration. No route is exposed
yet; the decoder alone does not authorize callers. Schema/storage-policy changes
need a concrete proposal and any required approval. No ticket criterion is complete.

## Upload boundary and persistence — 2026-11-06 20:11 UTC

Implemented raw-image POST /api/admin/photos and private GET /api/admin/photos/<id>.
Authorization uses currentAdminAccess before reading bodies or querying photos;
non-AAL2 callers are denied. Same-origin POST, streamed 8MiB cap, canonical decoder,
private/no-store responses and UUID-only references. Added a sixteen-slot Drizzle
photo store with transaction-serialized allocation and SQL size/dimension limits.
No UI, remote fetch, public gallery, new service or existing policy change.
Storage/access/retention contract is docs/reviews/TICKET-175/storage-contract.md.

Generated migration0013 initially had a constraint truncated by Drizzle at a literal
semicolon. It was never applied. Interactive generator drop was rejected by automatic
approval review as unscoped. User approved exact-path removal of only the two new
untracked artifacts and restoring the journal to HEAD. This was done; changed schema
expression to chr(59), then regenerated through Drizzle. Corrected migration applied
twice in this isolated stack with matching row/migration counts; all17 tables retain
RLS. Rollback-only database test passes normalized round-trip, orientation/EXIF,
quota and anonymous read denial. No production database touched.

Unit upload/decoder tests22 pass; private-delivery tests7 pass in full-suite run.
Production build passes. Real email OTP/TOTP upload journey passes mobile+desktop
(2 tests,3.7s), including anonymous write/read denial and cross-origin rejection.
Synthetic photo rows cleaned by exact IDs; synthetic Auth accounts remain only in
this disposable stack. Runner overrides the allowlist in its child process only.
Logs: /tmp/TICKET-175-build.log, /tmp/TICKET-175-browser.log.

Full verify stopped in unit tests:1051 pass,97 skipped,3 existing hook tests fail
because the modified migration journal lacks exact-path authorization. No tests or
hooks were weakened. Migration commit/authorization request is pending for:
drizzle/0013_invitation-photos.sql, drizzle/meta/0013_snapshot.json,
drizzle/meta/_journal.json. Proposal: docs/reviews/TICKET-175/migration-approval.md.
Only pnpm-lock.yaml is currently authorized in the ignored approval record.
Final quick+browser smoke are running in session94270; see /tmp/TICKET-175-final-quick.log
and /tmp/TICKET-175-smoke.log. New source/migration/docs are not committed or pushed
yet. Do not claim PR107 contains these new changes until pushed.

Next: finish smoke checks, obtain pending migration commit authorization, record exact
paths, rerun full verify (hook failures must clear), update ticket/evidence/PR body,
commit and push, then t:pr. No merge authorization for107. Other branches also have
0013 migrations; inspect current develop before any explicitly approved base update.

## Final verification checkpoint — 2026-11-06 20:17 UTC

Final quick gate passed. Browser smoke finished exit0:837 passed,189 skipped,5.1min.
No product test failures. The full verify result remains failed because of the three
protected-journal hook tests; approval is still pending. Marked175 blocked through
the CLI; the shared ledger is updated. Local code/docs/ticket/generated migration
remain uncommitted because the protected-file authorization is outstanding.
The previous pushed decoder commit remains fe81e532. Do not bypass hooks to publish.

## Approved full verification — 2026-11-06

User approved the three generated migration paths and recording authorization.
Recorded exact paths in the ignored approval file, resumed via CLI and pushed status
commit23bcf08. Full pnpm verify now passes (session25722 exit0):1054 unit tests,97
opt-in skips,build/lint/types/format,837 browser passes,189 skips,4.5min browser run.
Log /tmp/TICKET-175-approved-verify.log. All acceptance criteria now checked against
unit, isolated database and real admin browser evidence. Prior three hook failures
cleared solely through the approved authorization; no tests/hooks weakened.

Next: commit/push implementation and updated evidence, run t:pr175, inspect final CI.
Keep in_review until verified merged into develop; no PR107 merge exception exists.
No production migration is authorized.

Implementation committed and pushed as9cc8ecdc. First t:pr preflight rejected custom
PR headings; corrected them to the required template headings. No verification was
skipped. Rerun t:pr on the corrected body.
