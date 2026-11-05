# TICKET-181 handoff

2026-11-05. Owner divine/codex, branch TICKET-181. Fresh base develop
c9c9e66010ee773189477139d4f8b0d30cf481e1. Claimed through live ledger after
TICKET-048 was blocked on pending migration/budget approval. No feature code yet.

Reviewed ticket dependencies, PRD THM-2/3/6, theme storage/registry/validation,
admin AAL2 boundary and installed Next revalidateTag guide. Existing themes table
has tokens/is_active; event settings holds a light/dark selection. Current reader
resolves preset IDs only. Draft storage must be separate from published tokens so
saving a draft cannot change the live site. Dated plan records validation and
concurrency requirements. No new schema or migration is generated or approved.

Managed worktree installation and isolated database startup succeeded; initial
existing-migration application completed successfully (setup exited 0). No new
migration was generated or applied. App39470,
Playwright39471, database39461; project wedding-a7dd5180a5a7. No other stack touched.
Next: confirm setup completion, write failing service tests, implement validated
save/publish storage and AAL2 actions, then full integration and UI/artifact checks.
No acceptance criteria complete; no product/database verification claimed.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/104. Planning commit1a447be
is pushed; no implementation or feature-test result yet.

## Draft validation service — 2026-11-05

Added internal saveValidatedThemeDraft with injected AAL2 authorization and a
draft-only persistence boundary. Authorization precedes validation and I/O; the
canonical loadTheme validator reports named schema/contrast/font failures. Failed
authorization or persistence returns a safe result without database exception text.
No public action or database repository is wired yet; this is not usable storage.

Seven behavioral tests pass, plus lint/types through verify:quick. Initial red run
failed on the missing module. First implementation run exposed a fixture that changed
theme ID while retaining another theme's texture path; removed the optional texture
from that synthetic fixture and kept canonical validation unchanged. Logs:
/tmp/TICKET-181-drafts-red.log and /tmp/TICKET-181-drafts-quick.log.
Next: implement separate draft/published storage and atomic activation, then AAL2
action wiring, server reads and real database/browser verification. No new migration
or completed acceptance criterion. PR104 remains draft.

## Publication repository and generated proposal — 2026-11-05

Added complete light/dark publication validation and internal repository methods.
Draft writes preserve published tokens; publication uses a transaction-scoped
advisory lock, locks selected draft rows, revalidates both schemes/identities,
publishes snapshots and changes singleton selection in one transaction. Cache
invalidation remains outside the transaction and is not wired yet. Four new
validation tests passed after the expected missing-module red run. Quick gate:
lint/types,59 passes/66 skips. No database atomicity claim from those tests.

Generated additive published_tokens column only. Three outputs remain local,
unapplied and uncommitted pending approval: drizzle/0013_theme-published-tokens.sql,
drizzle/meta/0013_snapshot.json, drizzle/meta/_journal.json. Review proposal:
docs/reviews/TICKET-181/migration-approval.md. Static snapshot diff changes only
public.themes. Next: approval and isolated DB evidence, admin actions/cache and
published-reader integration. No acceptance criterion complete.

## Runtime and admin action integration — 2026-11-05

Added a single-query published-theme reader joining singleton selection with both
published snapshots. It never reads editable tokens. Canonical validation checks
identity and scheme; absent preset snapshots use preset tokens, invalid/custom
missing snapshots trigger sanitized default fallback. Updated the cached runtime
to use this reader and transactional publisher; immediate tag expiry occurs only
after successful publication. Existing activation/cache assertions are retained;
added a failure/no-invalidation assertion and custom-published-reader tests.

Admin save/activate actions now check currentAdminAccess ready (AAL2) themselves.
Seven action tests cover signed-out/denied/enroll/challenge, authorized writes and
safe errors. Latest quick gate passes lint/types and21 tests/7 skips. Reader test
first failed against the old preset-only implementation. Log:
/tmp/TICKET-181-runtime-quick.log. These are mocked boundary tests, not real Auth
or database verification. Existing PDF/PNG/offline consumers call the shared reader;
actual post-activation artifacts and initial HTML still require end-to-end checks.

Migration approval remains pending, so new SQL is unapplied and protected outputs
uncommitted. Next: isolated database tests after approval; verify draft/live isolation,
concurrent activation, rollback and read consistency; then production build/browser
checks and full verify. No acceptance criteria marked complete.
