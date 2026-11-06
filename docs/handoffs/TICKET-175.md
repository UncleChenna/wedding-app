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
