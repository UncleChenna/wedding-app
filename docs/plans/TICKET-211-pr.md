# Ticket

Ticket: [TICKET-211](https://github.com/UncleChenna/wedding-app/blob/TICKET-211/tickets/TICKET-211-prepare-ui-ux-and-full-stack-improvement-workspa.md). Target: develop. Draft: this source branch uses base2f066eb; current develop already owns migration numbers0006–0011. Reconciliation and a fresh exact-path proposal are required before integration.

# Summary

The original populated schema could not upgrade safely, and invitation-wide replies lacked member state, conflict protection and atomic history. This phase adds transactional member responses and a controlled legacy conversion. It also repairs old-Git branch checks and isolates hook tests from unrelated dirty files, preserving rejection of unapproved protected changes.

# Changes

- Generated0006–0008 add household/member metadata, member responses, scoped retry receipts and restricted original-record archive; keep RLS enabled with no browser policy, set365-day defaults and preserve large-group allowances.
- The shared writer validates the private capability and actual household membership, locks the invitation, checks expected revision/deadline/reopening, writes attendance/diet/history and records replay receipts atomically. The existing form supplies revision/retry metadata and preserves the aggregate pass projection.
- A separately flagged legacy bridge archives original database JSON/timestamp precision, runs unchanged pending SQL and restores mapped identities/data in one transaction. Default execution refuses an implicit bootstrap conversion. No hosted execution or token reissue is authorized by source approval.
- Wrong-target migration/seed CLIs now reject before importing the heavy schema graph; the existing no-connection/no-secret tests pass unchanged. Deterministic local seed and repeat migration counts match after this refactor.
- Replace unsupported Git branch lookup with symbolic-ref, fail closed on detached HEAD, preserve message-prefix checks and support explicit execution/Git-C targets without allowing main/develop writes. Install the tested hook/parser copy in the primary checkout for the active tool guard; no primary-branch commit.
- Hook tests use disposable repositories and clean Git environments. Explicit pre/post/stop/commit tests still reject unapproved protected writes before verification. Real Git2.15 and portable unsupported-flag cases are covered. No hook, assertion, timeout or retry is disabled.

# Acceptance criteria and evidence

The full mandate and outstanding work are mapped in docs/implementation-checklist.md. Member validation/concurrency and populated/current-schema preservation are covered by recorded local DB regressions; large-group and exact original JSON/timestamp preservation are included. New source artifacts were generated through Drizzle; applied0000–0005 remain unchanged. The generator reports no drift on both the disposable-copy and actual approved snapshot set. Seven exact SHA-256 hashes and SQL review findings are in docs/reviews/TICKET-211/migration-source-review.md.

Fresh/repeat migrations and deterministic seed counts were verified only in the managed local stack. The human record is unchanged and covers only the seven listed source paths. Full UI/hosted/release requirements remain explicitly unverified below.

# Verification

PASS: VITEST_MAX_WORKERS=1 pnpm verify completed with exit0, using the unchanged default browser worker count. Ticket validation, formatting, lint, types and production build pass;682 unit cases pass/42 conditional skips,697 browser cases pass/147 conditional skips. Evidence:artifacts/TICKET-211/verify-canonical-final.log. No current failure remains in this local original-base gate. Earlier failed runs remain recorded below.

Focused streaming regression:26 invitation-page cases pass after reusing the exact upstream heading-readiness assertion; all original keyboard/accessibility/layout assertions remain. Earlier evidence:37 database integration cases;6 final preservation cases;10 actual mobile/desktop RSVP cases;4 additional pass/RSVP cases;60 visual states across four themes and three widths. Current focused regressions:56 hook cases on real Git2.15,14 final branch/parser cases,3 unchanged wrong-target CLI cases. Fixture identity was confirmed before repeating seed/migration happy paths; counts match with9 applied migrations and zero token reissues. No hosted operation ran.

Failed default/two-worker unit runs, serial envelope/dashboard timeouts and four-browser-worker timeout traces are preserved under artifacts/TICKET-211. A subsequent lint startup stall led to a pnpm frozen-lockfile dependency refresh using copy import and a temporary store; the lockfile is unchanged. No assertion or time limit was relaxed. Those failures are not silently replaced by a targeted-only passing claim. See docs/handoffs/TICKET-211.md for exact final evidence and limitations.

# Risks and rollout

DEPLOYMENT BLOCKED. Do not apply this older migration sequence to current develop or treat source approval as execution permission. Reconcile the merged ordering/staff/RSVP work and regenerate future artifacts under a separate reviewed exact-path proposal. The source branch is reviewable, not merge/deploy ready.

The legacy bridge contains TRUNCATE and runs historical column-dropping SQL. Before any hosted execution require a reviewed target-specific plan, verified backup, restore rehearsal and explicit execution authorization. Source approval does not permit invitation-token reissue or real-data deletion. Failures before commit roll back schema/data/journal; after commit use a reviewed fix forward or verified separate-target restore/cutover, not table drops. Cloud restoration is unverified. Archive/history/receipt retention, event-end anchoring and preservation holds remain incomplete;365 is not a deletion job.

Full member UI/approvals, guest/staff authorization, seating/orders/delivery/alcohol, durable notifications/provider integration, content and complete responsive flows remain checklist phases. No wedding-readiness claim.

# Screenshots

See docs/reviews/TICKET-211/README.md and its four contact sheets plus representative originals. Full local60-image set is artifacts/TICKET-211/rsvp. Synthetic people/settings only; user photography remains unchanged.

# UI checklist

The detailed checklist records PASS for existing-layout regression screenshots, tokens, typography, keyboard/focus, reduced motion, automated contrast, copy/shared controls and emulated44px/no-overflow checks. Not verified: Lighthouse95/guest CLS, physical WhatsApp/iOS/Android/camera/Auth/MFA and safe-area handling. Staff feedback is N/A for this guest-only slice. Full UI decision remains CHANGES REQUESTED; design-reference fidelity is unverified because owner sign-in/assets are needed.

# Harness changes, if any

Portable branch/common-directory lookups, workdir/Git-C branch-target protection, strict message validation and isolated hook fixtures are included. Existing protected-file authorization remains active. Only supported execution worker limits were used; CI configuration, hooks, test assertions/timeouts and retries remain intact. No approval record was created by this work.

## 4 November minimum-Git follow-up

The primary stop gate exposed an unsupported init -b and unchecked setup in the symlink fixture. Portable setup now checks all child results and requests absent global configuration where supported. All original assertions remain. The same case fails before repair;43 hook/pnpm cases and the primary quick gate pass under actual Git2.15. Final full-gate evidence is recorded in the dated handoff before publication. Migration approval, current-develop integration and deployment/device blockers are unchanged.

The first full run of this fixture follow-up had one envelope focus timeout (696 browser passes/147 skips). Its unchanged focused case passes in2.3 seconds; trace is preserved. No product/UI/test timing modification was made. The cause remains unverified and passing subsequent checks does not establish device or wedding readiness. The final complete-gate result is recorded in the handoff.

Second default-worker full run:682 unit passes/42 skips and build;695 browser passes/147 skips, with mobile midnight-champagne768 envelope viewport and mobile blush-sage768 letter Enter timeouts. Traces are retained in stop-fixture-browser-failure-retry. These are unresolved default-worker timing observations, not a product fix. Added an explicit PW_WORKERS resource limit with positive-integer validation; unset retains the existing runner default. No CI settings, assertions, clocks, timeouts or retry counts change. Before the change an invalid0 was ignored; after it must fail before discovery. Valid2 must list the identical844 smoke cases. Use PW_WORKERS=2 for the complete gate and normal review workflow on this host; record every result and preserve earlier failures.

## Final local follow-up verification

Complete gate passes with VITEST_MAX_WORKERS=1 PW_WORKERS=2:682 unit passes/42 skips,697 browser passes/147 skips, build/lint/types/format/ticket validation pass. Discovery remains844 smoke cases. The actual primary stop entrypoint passes with Git2.15;43 fixture cases plus14 compatibility/denial cases pass under that version. Default-worker failures remain preserved and their cause unverified; this is a documented runner-capacity result, not a product/UI timing repair, integration result or readiness approval. The normal review CLI independently repeats the complete gate before its metadata transition.
