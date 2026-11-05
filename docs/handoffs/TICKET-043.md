# TICKET-043 handoff

2026-11-04 — divine / codex — branch TICKET-043.
Base: develop `c3dd68fa5f2e6d2ef134fae18d12eea7cd05171f`.
Draft PR: https://github.com/UncleChenna/wedding-app/pull/99.

Implemented a partial revoke/reissue workflow: strict confirmed commands, expected
status/version conflict checks, authenticated administrator actions, transactional
invitation update plus a dedicated lifecycle audit table definition, and a minimal
live gate-session-protected revocation snapshot endpoint. Reissue preserves RSVP
attendance and rotates the capability/version; audit records omit capabilities and
contact details. Admin Sharing includes confirmation sheets and /dev/share offers
an explicitly synthetic preview.

Verification: lint/types pass; verify:quick reports 64 passing related tests and
53 skipped. Focused browser checks pass 13/13 using the dev preview server, including
four themes at 375/768/1280, keyboard confirmation/Escape/focus return, axe AA,
44px targets, no horizontal overflow and unauthenticated snapshot rejection.
24 screenshots are in docs/reviews/TICKET-043/screenshots. The mobile ivory revoke
capture was visually inspected. This does not certify production build, Lighthouse,
physical devices, authenticated database actions or offline scanner integration.
Logs: /tmp/TICKET-043-quick.log and /tmp/TICKET-043-browser.log.

No migration was generated or applied. PR89 owns migration0012; resolve integration
order before generating the audit migration. Isolated stack startup failed during
worktree setup. Project wedding-bf77f6b10d5f, database20301, app20310, browser20311.
Do not use a copied primary database URL or touch other collaborators' stacks.

Next: restore this isolated database when capacity is available, settle PR89 migration ordering, generate and
review the additive audit migration with exact-path authorization, test transaction
rollback/concurrency and real old-link rejection, then run full verification/UI
checks. Do not merge this draft without the migration and database evidence.
Scanner download and real offline-scanner end-to-end testing remain mandatory in
TICKET-065; this ticket tests its snapshot contract only. No acceptance criteria
are marked complete yet. The shared ledger remains authoritative.

## Database follow-up — 2026-11-04

Added four opt-in real PostgreSQL tests in `scripts/__tests__/invitation-lifecycle.integration.test.ts`:
old capability rejection/new lookup and audit contents; revocation preserving RSVP;
audit insertion failure rolling back the invitation; and competing reissues producing
one success and one audit event. Types pass. These tests have NOT executed: base
migration failed first, so the shell did not launch the test command.

The owned stack started successfully on retry. The existing committed migrations
then exited 1 without a useful diagnostic. pg_isready still accepted connections,
but Colima had only 119 MB available of 5910 MB; memory pressure is observed, not
proven to be the migration exit cause. Stop only this stack with backup preserved.
Logs: /tmp/TICKET-043-db-start.log, /tmp/TICKET-043-base-migrate.log,
/tmp/TICKET-043-db-stop.log. No new audit migration generated/applied.

Five new non-database service tests pass: invalid actor/command never opens a
transaction; capability collision retries stop at five; unrelated uniqueness,
connection and constraint errors propagate without retries. The fixture concurrency
test retains its audit and deactivates only its synthetic invitation.

Exact next database test after the approved migration is available:
RUN_INVITATION_LIFECYCLE_DB_TESTS=1 pnpm exec vitest run `scripts/__tests__/invitation-lifecycle.integration.test.ts`

## Approved base update — 2026-11-05

Owner approved integrating develop 5747c3d62927bd8c34d71c545bba3663d3674e07
and recording exact-path authorization for unchanged 0012 request-budget SQL,
its snapshot and journal. The merge is conflict-free; all three staged Git blobs
match the approved develop commit exactly. Authorization is recorded in the ignored
.harness/approved-writes.json. No new audit migration was generated or applied.

Integrated verify:quick passes lint, types and 211 related tests, with 66 opt-in
skips. Log: /tmp/TICKET-043-base-quick.log. Skips are not database verification.
PR89 is merged and TICKET-185 is done in the ledger, so migration ordering can now
proceed after 0012. Next: generate/review the dedicated audit migration through
Drizzle, obtain its distinct exact-path commit authorization, then verify against
this worktree's isolated database when capacity permits. Full verification and
actual authenticated lifecycle journeys remain required before review.

## Audit migration generated for review — 2026-11-05

Drizzle generated `drizzle/0013_invitation-lifecycle.sql`,
`drizzle/meta/0013_snapshot.json` and the new journal entry. SQL adds only the
lifecycle audit table, constraints, foreign key/index and RLS enabled with no
policies. Static JSON comparison verifies all existing tables and journal entries
are unchanged. These outputs remain uncommitted and have NOT been applied.

Review: `docs/reviews/TICKET-043/migration-approval.md`. Exact-path authorization
for these new outputs and the changed journal is separate from the prior unchanged
base-file approval. Do not stage them using that old approval record. Existing
standalone audit tests are ready, but capacity and actual migration verification
remain outstanding. No production application is authorized.

## Migration approved and database tests passed — 2026-11-05

Owner approved all three 0013 outputs and authorization record; .harness/approved-writes.json
now records that exact approval. Used Supabase CLI's supported --exclude option to
start only PostgreSQL in this worktree's existing managed project, with normal
health checks. It used substantially less VM memory than a full stack. Existing
.env.local target checks passed; no secret values were displayed or rewritten.
Auth, Realtime, gateway and mail services are NOT running and are not certified.

Applied migrations twice with identical counts (14 applied migrations); RLS is
enabled on all 17 public tables. All four lifecycle DB tests pass in 838ms. The
first run passed three and exposed a test-only DTO mismatch: resolveInvitation
returns attendance "yes", not boolean true. Corrected the expected value to that
existing contract and reran all four. Seed repeat counts also match and RLS remains
enabled. No reset or production data changes occurred.

Logs: /tmp/TICKET-043-migrate-first.log, /tmp/TICKET-043-migrate-repeat.log,
/tmp/TICKET-043-counts-first.json, /tmp/TICKET-043-counts-repeat.json,
/tmp/TICKET-043-seed-first.log, /tmp/TICKET-043-seed-repeat.log,
/tmp/TICKET-043-seed-counts-first.txt, /tmp/TICKET-043-seed-counts-repeat.txt.
Seed resets the isolated synthetic fixture data, so future lifecycle tests must
create their own fixtures as already implemented. Next: quick/full verification
and real authenticated admin reissue browser coverage before review. Draft PR99
remains incomplete. Stop only this owned project with backup preserved when finished.

## Authenticated journey and full verification — 2026-11-05

Approved migration outputs were committed and pushed in 495310f. Full pnpm verify
at that source passed: 1044 unit tests (95 skipped), production build, and 849
browser tests (183 skipped). Log: /tmp/TICKET-043-full-verify.log. Skips do not
constitute verification of opt-in flows.

Added e2e/admin-invitation-lifecycle.spec.ts with real local email OTP and TOTP
administrator authentication. After fixing strict fixture narrowing, typecheck
passes and both mobile and desktop tests pass (2/2, 5.7s). They verify cancellation
leaves data unchanged, reissue invalidates the old link and preserves the reply,
revocation invalidates the replacement link, and both audit events identify the
actual authenticated actor with timestamps. Fixtures are synthetic; audit rows
are retained and fixture invitations are deactivated afterward.

For these tests, restarted only the owned project with preserved data and enabled
PostgreSQL, Auth, gateway and local mail using the supported CLI exclusions.
Realtime and other excluded services are not certified. No other stack was stopped;
no production database application occurred. No secret values were printed.

The new test is opt-in: RUN_ADMIN_LIFECYCLE_TESTS=1. Use fresh per-project local
example.test emails through ADMIN_LIFECYCLE_TEST_PREFIX and ADMIN_EMAIL_ALLOWLIST;
unset ADMIN_TEST_EMAIL and ADMIN_MENU_TEST_EMAIL overrides when using fresh names.
Both projects must be allowlisted on the production test server. Run:
pnpm exec playwright test e2e/admin-invitation-lifecycle.spec.ts --project=mobile --project=desktop --workers=1

Next: finish the remaining UI review evidence (inspect every screenshot, load/CLS
and applicable device checks), update the acceptance checklist, and run t:pr for
final review verification. PR99 remains a draft; this evidence is not a claim of
physical-device or offline-scanner completion. TICKET-065 retains the latter.
