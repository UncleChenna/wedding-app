# TICKET-166 handoff

2026-11-05. Owner divine/codex. Branch TICKET-166, base develop
c9c9e66010ee773189477139d4f8b0d30cf481e1. Claimed through live ledger after
TICKET-181 was blocked on migration approval. No feature code yet.

Read PRD security/privacy, TICKET-080/096 handoffs, staff session/PIN/device
repositories and event settings. Staff expiry already defines06:00 venue-local on
the day after the wedding. Reuse it; missing timezone blocks closure. Existing
PIN revocation/version fields, devices and orderingOpen appear sufficient without
new SQL. Dated plan covers atomic closure, idempotence and allowlisted aggregate
CSV/PDF. Actual production closure remains time-gated and human-confirmed.

Managed install complete; isolated Supabase startup remains live in session39238.
Do not restart on timeout or touch other stacks. Project wedding-cb98dc8b6300,
app22410/browser22411. Confirm setup terminal result before database tests.
Next: failing pure closure/export tests, implementation, real isolated rehearsal,
full verification and detailed PR. No acceptance criteria complete or feature tests
run yet. Preserve admission evidence, including unsynced browser queues.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/105. Planning commit54c62bf
is pushed. Setup session39238 was polled and remained live; no database success
or failure is inferred from elapsed time.

## Closure guard and aggregate CSV foundations — 2026-11-05

Implemented evaluateEventClosure: exact CLOSE EVENT confirmation, explicit evidence
preservation acknowledgement, unchanged event date and existing06:00 next-day
venue-local cutoff. Unknown zone/invalid clock/premature closure fail closed.
Implemented aggregate allowlist projection and CSV serialization with quoted
commas/quotes/newlines and formula neutralization. Extra contact/dietary fields
are stripped; no database query/action or PDF renderer is wired yet. Menu labels
remain intended public metadata, not arbitrary guest-entered notes.

Both test modules first failed because implementations were absent. Final quick
gate passes lint/types and22 tests. Logs /tmp/TICKET-166-closure-red.log,
/tmp/TICKET-166-memories-red.log, /tmp/TICKET-166-foundations-quick.log. No event
closure or production write occurred; these pure tests do not verify revocation.

Setup session39238 TERMINATED exit1: Supabase startup failed. Do not treat it as
live or run DB commands against the copied main URL. Sanitized db:status/container
health/port inspection is running in session48279; obtain its result before retry.
No other stack stopped. Next: complete isolated setup, implement transactional
closure/authenticated action and aggregate query/PDF, then database/browser rehearsal.

Status inspection session48279 terminated: owned database container does not exist;
reserved22401 has no listener. Docker responds, but several stacks report unhealthy
services. This does not prove the startup failure cause. No stacks stopped and no
DB mutation attempted. Next inspect supported reduced-service startup/owned setup
logs before retrying; do not run migrations using copied main credentials.
Foundations pushed in31381b3; PR105 remains draft.

## Anonymous PDF renderer — 2026-11-06

Resumed through the CLI for database-independent work while stack capacity remains
constrained. Added an internal PDF renderer using the existing aggregate allowlist,
local embedded fonts and all four themes. No public download route or database
query is wired yet. Extra contact/dietary fields do not reach its document tree.

Six new tests pass: four actual themed A4 PDFs with embedded fonts and privacy
projection, invalid-input rejection before rendering, and pagination of 90 menu
items. The initial missing-module test failed as intended. Intermediate tests
exposed a whitespace issue in the test text extractor and a type-import lint error;
both were corrected without reducing assertions. Final verify:quick passes lint,
types and six related tests. Logs: /tmp/TICKET-166-pdf-{red,green,quick}.log.

RUN_MEMORIES_PDF_REVIEW=1 writes synthetic samples to artifacts/TICKET-166. Native
PDFKit opened the ivory sample, extracted only expected aggregate text, and
rasterized it at 300dpi; that first page was visually inspected. The reused helper
prints an A5 label, but the actual MediaBox test confirms A4. Other themes render
in tests but have not yet received native visual review. No whole-ticket UI approval
or full verification is claimed. Transactional closure, authenticated downloads,
aggregate database query, revocation rehearsal and complete visual review remain.
No Supabase stack was started/stopped in this follow-up. Database setup still needs
recovery before integration verification; never migrate against the copied main URL.

## Private download boundary and aggregate query — 2026-11-06

Added /admin/memories/csv and /admin/memories/pdf?scheme=light|dark as route-only
wrappers around an independently authorized module boundary. Live AAL2 access is
checked before querying; invalid options fail before loading data. Responses use
fixed filenames, no-store/no-referrer/noindex/nosniff; errors are sanitized.
CSV reuses the allowlist and formula protection, PDF uses the stored theme pair.

The repository selects counts and public menu names only in a read-only,
repeatable-read transaction. It counts RSVP households separately from attendance,
and sums station-order quantities excluding cancelled projections. Served totals
come only from served station orders. It never selects guest/order notes or contact.

Nine download tests pass; the first run failed for the missing implementation.
Final quick gate passes lint/types/nine tests; one guarded real-database test is
SKIPPED, not passed. Log /tmp/TICKET-166-download-final-quick.log. That pending test
uses exact random fixtures and cleanup, checks baseline deltas, zero-order menu
items, cancelled quantities and privacy. RUN_MEMORIES_DB_TESTS=1 only after managed
setup succeeds. Docker still reports no owned database container. No database was
started, migrated, reset or borrowed. Full build/browser and actual aggregate query
execution remain unverified. Next: transactional closure/action, database recovery,
integration rehearsal and UI review. PR105 stays draft; no criteria marked done.

## Native PDF follow-up — 2026-11-06

Native PDFKit opened all four theme samples and the seven-page90-item menu.
Text extraction includes every synthetic menu item and no private fixture markers.
All four theme first-page layouts have been visually inspected; the final long-menu
page was also inspected. Native review discovered that the original Text render
callback did not produce page-number content in the installed renderer. A View
callback returning a Text element fixes it. Its final-pass total is narrowed at
runtime because View's type only declares the current page number.

Added scripts/verify-memories-pdf.swift: it checks real A4 media boxes, each page's
number/total, and absence of private fixture markers. All five generated PDFs pass
after the correction; the long sample reports1/7 through7/7. Six renderer tests and
the final quick gate pass; log /tmp/TICKET-166-footer-quick.log. No full browser/device
approval is implied, and not every middle long-menu page received visual inspection.

Capacity audit confirms no completed owned running stack can be stopped under the
current rule: TICKET-106 is done but owned by unclechenna, TICKET-084 is their active
work, TICKET-043 is mine but blocked. TICKET-048 stop exception remains pending.
No stacks touched. CI42233436981 for6675360 was still live (four checks passed,
pnpm verify running) before the footer follow-up; later source needs its own CI.

## Closure transaction and action — 2026-11-06

Added an AAL2-authorized Server Action and internal transactional closure. It locks
event settings, samples server time after the lock, checks current date/timezone and
the exact confirmation/evidence acknowledgment, closes ordering, clears non-admin
PIN material and revokes active devices. It never deletes admission evidence or
admin identities. Repeated closure skips already-revoked rows and closed settings.
Revocation uses revokedAt rather than incrementing credentialVersion; the existing
staff authenticator independently rejects revoked records and missing PIN material.

Ordering now holds a settings share lock until its submission commits, matching
closure's update lock. Staff-entered orders recheck event expiry after that lock so
an earlier authorization cannot bypass closure via the temporary-pause exception.
The existing staff-order integration fixture now supplies an unexpired event and
restores it afterward; a new expired-staff-order assertion retains the no-write check.

Eight action tests pass, along with lint/types. The first run failed for the missing
implementation. Final log /tmp/TICKET-166-closure-final-quick.log reports23 skipped
database tests, not passes. Added rollback-only real-DB closure rehearsal covering
early refusal, revocation, admin/admission preservation and repeat invocation; it
has NOT run. Actual concurrent ordering/closure rehearsal, staff-session rejection,
full verification and UI/navigation remain unverified. No database mutation or
production closure occurred. CI42231564205 for the preceding commit was still live
before this follow-up; do not treat it as verification of this new source.

## Admin navigation and confirmation form — 2026-11-06

Added the protected /admin/event-closure page and control-room link. Page access
is verified before settings are read. It offers native non-prefetched PDF/CSV
downloads, explains the venue-local cutoff, and leaves closure disabled when the
timezone is unknown or cutoff has not arrived. The form requires CLOSE EVENT and
an initially unchecked acknowledgment for all scanner evidence. Controlled fields
retain input on refusal; live status announces outcomes and success disables it.
The form adapter delegates to the existing independently authorized Server Action.

New tests first failed for the absent component. Fixed a download-link lint error
using native-download Next Links and a readonly test tuple mismatch. Final quick
gate passes lint/types/117 related tests, one opt-in skip. Log
/tmp/TICKET-166-ui-final-quick.log. React review keeps auth-dependent reads sequential,
minimal client props and direct shared-component imports. Full UI checklist recorded
as incomplete in docs/reviews/TICKET-166/ui-review.md; no browser/device pass claimed.
Docker capacity recheck:608MB available; no new stack or database action attempted.
Next: restore isolated setup once capacity permits, execute database/ordering/session
rehearsals, inspect all-theme UI/PDF output, run full verify and publish ready review.

## CI confirmed; local capacity prerequisite — 2026-11-06

Run 42234349167 completed successfully at exact head
c7c454e95ecbb6bf724f037cc14db06268298dbd: all five required jobs pass,
including full verification and the invitation journey. This does not certify
the opt-in memories/closure database tests or closure-specific staff-session E2E;
their flags are not enabled by the CI workflow. PR105 remains draft.

Docker recheck found only537MB available. TICKET-181 remains stopped with its
database/storage volumes preserved. No collaborator stack was stopped. Requested
permission to stop idle owned TICKET-048 with backup preserved; its blocked status
requires an exception to the completed-stack rule. That request is unanswered.
Do not run database commands against the copied primary environment. Once capacity
is available, run the managed db:start wrapper in this worktree to establish its
own environment, then migrate and execute the guarded rehearsals. No production
closure or data deletion is authorized by this verification work.

## Capacity recovered and database rehearsal passed — 2026-11-06

The user approved stopping idle TICKET-048 while preserving its backup. Supabase
stop returned exit0 with backup:true for wedding-0b9a885bfc5f. No other stack was
stopped. TICKET-166's managed db:start then completed successfully and established
its isolated environment. Existing branch migrations applied successfully; all16
public tables have RLS enabled. The ticket resumed through the CLI at8d2fb2e.

Explicit RUN_EVENT_CLOSURE_DB_TESTS, RUN_MEMORIES_DB_TESTS and
RUN_ORDER_SUBMIT_DB_TESTS execution passed all24 tests across three files, with
one worker. This proves the prepared transaction/idempotency, aggregate export and
ordering cases against the real isolated database. It does not yet prove the
browser closure flow, existing staff-session rejection or concurrent closure/orders.

Full pnpm verify is running in session3368, logging to
/tmp/TICKET-166-full-verify.log. Poll that existing handle; do not start another
browser run sharing its output directory. Next: finish this gate, implement/run
the remaining browser and concurrency rehearsals, complete UI review, then update
PR105. Physical-device checks remain unverified. No production closure occurred.

## Browser rehearsal prepared — 2026-11-06

Added e2e/event-closure.spec.ts and scripts/test-event-closure.ts. The runner uses
ephemeral in-process staff signing material and a fresh allowlisted synthetic admin.
The test refuses pre-existing staff/devices before mutating anything; it signs in
all three staff roles, checks denied private exports, completes real admin MFA,
checks early closure disabled and authenticated downloads, captures all themes at
three widths with AA assertions, and closes the synthetic event. It then restores
a future synthetic date to distinguish live credential revocation from simple
event expiry before checking all three existing sessions lose access. Exact test
fixtures/settings are restored in teardown.

Lint, formatting and typecheck pass for this rehearsal; it has NOT executed yet.
Full verification session3368 has passed1076 unit tests (99 conditional skips),
build, lint and types; browser smoke remains LIVE. Do not run the new rehearsal
until that session terminates. Then run pnpm exec tsx scripts/test-event-closure.ts
in this worktree. Screenshots still require inspection and concurrency remains
unrehearsed. No additional acceptance criterion is marked complete.

## Full gate, browser closure and concurrency passed — 2026-11-06

Session3368 terminated0:1076 unit passes/99 conditional skips, production build,
lint/types/format and851 browser passes/195 skips. Log
/tmp/TICKET-166-full-verify.log. Closure runner session78791 also terminated0:
real local admin OTP/TOTP, all three staff roles, protected exports, early-disabled
form, actual closure, revoked sessions even after restoring a future synthetic
date, retained admin access,12 theme/width AA/overflow checks all pass. Log
/tmp/TICKET-166-closure-browser.log. All12 screenshots inspected; mobile full-page
images show fixed navigation at the original viewport boundary, so focused-control
viewport checks remain required rather than treating the capture as sufficient.

Added a real ordering/closure race: hold an accepted order's transaction, observe
the closure query waiting on PostgreSQL's lock, commit the order, then assert
closure finishes and the next order is rejected without another inserted order.
The first run used the wrong result assertion (closed rather than rejected/closed);
corrected to the existing API contract. Both closure database tests then pass,
and quick lint/types pass (/tmp/TICKET-166-concurrency-quick.log). No application
code changed. Remaining: keyboard/focus/tap targets, cold CLS, reduced-motion and
physical-device review/disposition; publish updated PR evidence after these checks.

## Automated UI review complete; device disposition pending — 2026-11-06

Final expanded closure browser run session76239 terminated0 in14.9s; log
/tmp/TICKET-166-ui-browser-final.log. Keyboard tab/Space operation, focus outline,
44px target geometry and mobile focused action above navigation pass in all themes.
Reduced-motion interaction passes. Fresh authenticated contexts at375/768/1280
measure exactly0 CLS after fonts/network settle. Four focused viewport screenshots
inspected alongside all12 full-page images. Review copies are committed under
docs/reviews/TICKET-166/screenshots so GitHub reviewers can see the evidence.

An initial quick gate found an overly strong Window type assertion in the new CLS
test. Replaced it with typed Object.assign and optional read; missing measurements
still fail the exact-zero assertion. Final quick gate passes lint/types. All seven
long-menu PDF pages have now been visually inspected with no clipping found.

Requested permission to advance to review with physical-phone keyboard/safe-area
and download checks retained as release requirements. No answer yet; PR remains
draft and the ticket is not complete. No merge or production closure authorized.
