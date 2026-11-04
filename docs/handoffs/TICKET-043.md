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

Added four opt-in real PostgreSQL tests in scripts/**tests**/invitation-lifecycle.integration.test.ts:
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
RUN_INVITATION_LIFECYCLE_DB_TESTS=1 pnpm exec vitest run scripts/**tests**/invitation-lifecycle.integration.test.ts
