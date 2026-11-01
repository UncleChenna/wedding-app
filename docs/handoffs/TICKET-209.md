# TICKET-209 handoff — 2026-11-01

Owner divine; agent codex; branch TICKET-209; status in_progress.
Base0f30f2fc3045506944e5252adb396c40856f7e0c. Project wedding-669955f89d84; app25310/browser25311.
Live queue selected209 urgent, unowned and unblocked. Claimed through CLI, managed worktree setup82482 completed, dependencies reused pinned lockfile, isolated DB started and migrations applied. Status commitcdcec38 pushed.
Previous110 PR66 merged with all four final-head checks passing;104/109/210 also merged. Prior worktrees and evidence preserved.

## Current work

No runtime changes yet. Read ticket/PRD role/journey sections, current routes and source/design rules. Reviewed event-settings defaults/nullability, personal invitation, admin gate and existing e2e route inventory. New dated plan covers every209 acceptance criterion and verification boundary. Replaced stale plan link in own ticket only.
Initial board saved in artifacts/TICKET-209/initial-board.txt.
Database is running, migrated, not seeded. No app/build/test process is running.

## Next

Start with failing shared route-registry tests and inspect installed Next documentation before framework edits. Follow docs/plans/2026-11-01-TICKET-209.md; all feature criteria remain unchecked. Keep the whole scope, including admin sharing, production dev-route guard and negative orphan-route test.
Publish/update draft PR with actual progress; do not call t:pr or mark review until complete verification. Use explicit --owner divine --agent codex for CLI transitions.
User standing authorization permits verified merges and labelled preview delivery with physical/performance QA retained; no bypass or false device claims.

## Publication

Draft PR68: https://github.com/UncleChenna/wedding-app/pull/68. Plan commit4bd9383 is pushed; formatting,210-ticket validation and ignored snapshot rendering passed. Runtime implementation and all feature criteria remain outstanding. Next action is the failing route-registry coverage tests, not another planning-only pass.

## Route registry checkpoint — 2026-11-01

Implemented typed shared route metadata for all 18 current pages, encoded invitation paths, and neutral accessibility route samples. Migrated existing navigation and admin redirects to that source; destinations and authorization semantics are preserved. The browser accessibility inventory now derives from the registry.

Red test evidence: artifacts/TICKET-209/routes-red.log (missing module). Green: routes-green.log, four route inventory/access/encoding/sample tests pass. Initial quick check exposed the Node readdirSync string-or-buffer overload; explicit UTF-8 encoding resolves it without casts. Latest registry-quick.log passes lint, typecheck and five related unit tests. git diff --check passes. Full verification and browser/UI evidence have not run for this checkpoint.

All feature criteria remain unchecked. Next: implement tested settings-driven home and RSVP state/date next steps, then staff/admin hubs, authorized sharing, default production preview guard, journey docs and orphan-route browser checks per the dated plan. No final review or merge requested for this incomplete implementation. Managed database remains running, migrated, not seeded.

## Guest journey checkpoint — 2026-11-01

Home and public metadata now read persisted event settings; private invitation metadata contains only public event details. The generated OG image reads settings and saved light theme. No Uchenna/Adaora/date literals remain in src/app; previews use approved shared defaults. InvitationGuide is module-owned and gives honest resend/contact instructions until048; no simulated request action.

PersonalInvitation renders a reserved pass slot for yes and a warm closing for no while retaining reply editing. Successful server replies revalidate only the validated invitation path; invalid/unavailable/not-open results do not. Day-of navigation uses the venue calendar date. Unknown timeZone intentionally hides automatic day-of ordering navigation; owner still has venue/zone TBD. This does not implement ordering authorization or a real QR pass.

Evidence: next-step-red.log, personal-red.log, actions-red.log, home-red.log record failing tests before their implementation. invitations-unit.log:142 passing tests across15 files. guest-final-quick.log:lint/types/21 related tests pass. guest-build.log:production build passed before the final behavior-preserving InvitationGuide extraction; final full verify remains pending. rsvp-live.log:3 passing production browser tests, including no-JS and token/revocation failures. rsvp-review.log:12 passing all-theme/width cases covering initial/yes/no/error/closed, axe, overflow,44px controls and existing focus assertions.60 PNGs are in docs/reviews/TICKET-209/screenshots. Only ivory375 yes/no visually inspected so far; other full-page images and slices remain unreviewed. Existing install controls reserve224px even when unavailable, producing noticeable blank space beneath the pass; evaluate during final layout review without reintroducing CLS.

Full UI checklist, Lighthouse and physical checks remain unverified, all ticket criteria remain unchecked. Next implement staff/bar hub and admin/sharing, preview production guard and journey/orphan-route contract. Rebuild after subsequent changes and complete all evidence before review. Database contains only the synthetic RSVP test settings (venue RSVP browser test only); fixture invitations are cleaned by tests. No server/test process remains running after completed Playwright runs.

Harness finding: the shell guard twice misclassified explicit-path heredoc writes containing TypeScript arrow functions as dynamic shell writes. Explicit-path Python writes succeed without relaxing protections. A dedicated harness ticket should add a regression test for literal heredoc bodies rather than weakening the write guard.

## Staff/admin checkpoint — 2026-11-01

Added staff hub and bar page, shared station header and registry entries. Staff placeholders give human fallback instructions and return links; shared placeholder body/control text is18px and headings36px+. Order placeholder now has a useful fallback and home link. Android/iOS controls remain intact.

Admin hub lists every area and only Sign out for authenticated users. New protected /admin/sharing has a minimal invitation list and existing ShareMenu. Its reader authorizes before settings or invitation queries; it selects only invitation identity/status/token and primary guest names, with no contact export. Draft/revoked rows return guidance without bearer URLs. Published rows use configured site URL and approved message voice. Share builder avoids appending the same URL twice when the approved template already includes it. No sent-state write or external message sending occurs.

Added docs/journeys.md covering all21 current pages, five PRD roles including optional table host082, future admin area owners and explicit unfinished behaviors. Linked AGENTS/architecture and added route-contract guidance to ticket template. Docs explicitly retain the unfinished production preview guard and orphan-route browser test.

Evidence: staff-red.log and admin-red.log record missing navigation failures before implementation; share-template-red.log records duplicate URL failure. Focused hubs-unit.log:58 tests across9 files pass; sharing-unit.log:6 access/URL eligibility tests pass. hubs-final-quick.log:lint/types/47 related tests pass. hubs-build.log:production build passed. hubs-browser.log:13 passes (12 theme/width staff journeys, anonymous admin gate). sharing-anonymous-browser.log:1 pass after extending the gate test to /admin/sharing.48 staff PNGs captured in docs/reviews/TICKET-209/staff; only ivory375 staff/bar visually inspected so far. Remaining screenshots/long-page slices, authenticated sharing browser flow and full UI/performance/device review remain outstanding.

Next: finish production-default /dev guard with explicit isolated test preview support and proof of default404; implement the entry-point crawl with a negative orphan fixture; run authenticated admin sharing with synthetic local Auth/guest data, inspect all UI evidence, full verify and final-head CI. Do not merge or mark this ticket complete yet. Managed database remains running with synthetic RSVP fixture settings. All build/test sessions above completed and Playwright servers exited.

## Production preview guard — 2026-11-01

Implemented proxy guard for /dev and descendants. Development remains available; production requires ENABLE_LOCAL_PREVIEWS=1 and a loopback request hostname. Plain production startup is closed. Playwright alone passes the explicit opt-in to its local web server, preserving preview-based tests without changing deployment defaults or skipping tests. The accessibility redirect helper now waits for the new sharing route's anonymous redirect.

Evidence: preview-red.log records the initial missing-helper failure; preview-green.log has3 passing policy tests. preview-quick.log passes lint/types/related unit tests. preview-build.log passed. preview-browser.log has4 passing smoke cases across mobile/desktop: separate no-opt-in production servers returned404 for all7 previews, including an RSC query opt-in attempt; the explicit loopback server returned200 for all7. Child servers terminated after verification. The guard acceptance criterion is now checked; all broader criteria remain unchecked pending final evidence.

Next: implement the entry-point orphan crawl and negative fixture; verify authenticated sharing with synthetic local Auth/guest data, inspect outstanding screenshots and finish full UI/verification. docs/journeys.md now documents local opt-in and corrects offline behavior to retry only. This checkpoint does not certify final UI/performance/device behavior.

## Journey crawl checkpoint — 2026-11-01

Added browser link traversal in e2e/support/journey-crawl.ts and a negative fixture proving an unlinked registered page fails. Unlike a URL-list smoke test, it queues only configured entry points and rendered same-origin links. Dynamic invitation paths are canonicalized for reports; known screen return links are asserted. Added return links to admin sign-in/sign-out, MFA and offline fallback.

New opt-in e2e/journeys-live.spec.ts exercises synthetic local email/TOTP login, draft/revoked sharing exclusion, published share-menu URL and focus return, unchanged invitation sent state, all production entry-point traversal and the actual offline worker fallback. The offline route is an automatic entry: it is counted only after proving the precached fallback is rendered when the personal invitation loses network. No message is sent. Optional CAPTURE_JOURNEY_REVIEW=1 captures admin hub/list/dialog across four themes and three widths.

Evidence: crawl-red.log fails for the missing helper; crawl-fixture-green.log passes the negative fixture. crawl-build.log passed production build. journeys-final-quick.log passes lint/types; no related unit tests were selected for these files (not a unit-test coverage claim). Live journey is NOT VERIFIED: journeys-live.log failed with Send code still pending before the code field appeared. Health query later returned200 and Auth container reported healthy, so one unchanged retry was made. journeys-live-retry.log then failed before fixture creation with Postgres CONNECT_TIMEOUT at127.0.0.1:25301. Existing timeouts/assertions remain unchanged. No admin screenshots were produced.

Infrastructure: docker ps eventually reported Auth/Kong/DB healthy, Studio/pg-meta unhealthy. Read-only diagnostic session78455 is still live at this handoff: docker exec supabase_db_wedding-669955f89d84 pg_isready -h127.0.0.1 -p5432, then docker port for5432. Poll that exact handle before starting duplicate diagnostics. Both Playwright sessions50094/88724 are terminal failures; static check99851 is terminal pass. No factor was enrolled because both live failures preceded MFA. First run's finally attempted only its own synthetic invitation cleanup; verify fixture residue after the database recovers. Do not restart Docker globally or affect other worktrees.

Next: recover/verify this worktree's local database responsiveness using managed lifecycle if needed, then rerun unchanged live journey with ADMIN_EMAIL_ALLOWLIST=journeys-mobile@example.test RUN_JOURNEY_TESTS=1 CAPTURE_JOURNEY_REVIEW=1. It also requires the existing RSVP browser test fixture settings; do not overwrite real settings. Keep orphan/functional acceptance unchecked until the complete real crawl passes. Full UI inspection, performance/device gates and full verify remain outstanding.

## Recovered verification and visual review — 2026-11-01

Local Postgres recovered: host SELECT 1 completed in51ms; no Docker restart/reset or timeout changes. Unchanged full authenticated journey passed37.6s (journeys-live-recovered.log). Full pnpm verify then passed:584 units/26 skipped,731 browser cases/153 skipped (verify.log). That build preceded the final admin layout refinement.

Visual review rejected an ivory375 sharing loading-state screenshot. Added an explicit h1 readiness assertion before all admin captures. Sharing is now first in the hub and uses the same heading hierarchy. Staff capture is opt-in via CAPTURE_JOURNEY_REVIEW=1; all existing functional/accessibility assertions remain unconditional. This prevents ordinary verification from overwriting tracked evidence from competing DPR projects.

After refinements: admin unit passed, review-build.log passed, review-recapture.log passed13 cases (authenticated journey and12 staff theme/width checks,1.7min). All60 RSVP and36 regenerated admin screenshots inspected via contact sheets and long-page slices; all48 staff layouts inspected. REVIEW.md records scope/limitations.96 public/auth/showcase capture cases passed; those screenshots are now in docs/reviews/TICKET-209/public, but inspection is incomplete (only blush375 invitation guidance inspected). No final UI approval.

First production Lighthouse mobile measurements (artifacts/TICKET-209/performance.log): home90/accessibility100/CLS0.0001739702613579808; guide95/100/CLS0.01565972421950601; order96/100/CLS0; offline99/100/CLS0. Home performance and home/guide strict CLS fail. Lighthouse attributes shifts to font loading (home venue p and guide section); do not count rounded displayed CLS0 as exact zero. No font/layout fix has been applied for these findings. Preserve reports.

Next: inspect remaining public/auth/showcase screenshots, investigate local page font-shift findings without weakening zero-CLS checks or broadly changing font infrastructure, measure private invitation performance, finish final UI review/verification and update PR68. Device requirements remain not verified. Ticket209 stays in_progress; PR stays draft.

## Production entry-page review checkpoint — 2026-11-01

Home containers now stretch consistently, and invitation guidance uses an intentional two-line heading and shorter resend wording. Production build and quick verification passed (three related unit cases). The exact-zero cold-font regression test remains failing: baseline 14/16 failures; after local layout changes 12/16 failures. A focused follow-up passed light375 home/guide but failed dark412 home (CLS0.0002747458573055256) and guide (0.00008349233638978784), with unchanged reported source rectangles. No threshold was relaxed and no test was skipped.

Latest single-run production Lighthouse measurements: home98/100 with CLS0; guide99/100 with CLS0.0000998462969631127. The guide still FAILS exact-zero CLS. Six original and updated reports are preserved in performance/; these are individual measurements, not three-run performance certification.

All84 production public/auth screenshots (seven routes, four themes,375/768/1280) have now been inspected, replacing development-overlay captures. No clipping or overlapping controls found. Supplemental development showcase captures remain unreviewed. Actual authenticated MFA testing also passed (one opt-in local TOTP case,2.5min); all60 enrolment/setup/invalid-code/challenge/admin captures in mfa/ were inspected, including mobile bottom slices. QR/setup credentials in screenshots are public examples substituted by the existing capture helper; real authentication was tested separately.

Standard pnpm verify passed on this layout revision: format, lint, types,584 unit cases (26 skipped), production build and731 browser smoke cases (153 skipped,8.3min). It does not select the new cold-font test because the standard browser stage selects @smoke. This pass does not certify that failing regression or skipped cases. Private invitation performance and physical-device checks remain unverified. PR68 remains draft; final UI approval is outstanding.

Next: full verification session5349 has exited successfully (layout-full-verify.log). Retain the cold-font failure, investigate fallback baseline movement without weakening assertions, finish outstanding UI evidence and update PR68. Verification exited; no task app server remains running.

## Invitation performance and remaining font diagnosis — 2026-11-01

Three serial production Lighthouse runs of a newly created synthetic private invitation scored Performance99/100/100, Accessibility100/100/100 and CLS0/0/0 (median performance100). Reports: performance/lighthouse-personal-{1,2,3}.json. The fixture was deleted in finally; no real guest record was used. This verifies initial private-invitation load, not physical WhatsApp/device behavior or every post-reply interaction.

A DOM Range diagnostic isolated the public-page residual shift: element boxes and baselines stay fixed, but final-font glyph widths differ from fallback widths. At dark412, the centered venue text starts at x114.90625 before fonts and x118.46875 after; guidance date starts at x127.328125 then x124 because preceding text width changes. Exact-zero cold-font regression remains failing. No font policy, assertion or threshold has changed.

Extended the existing day-of component test to all three RSVP states; six component cases pass, covering pre-event and event-day rendering. Functional acceptance criteria now reflect the passed registry, settings, state, hub, traversal and standard verification evidence. The UI criterion remains unchecked. Requested a preview-only exception for residual font shifts while retaining TICKET-201's release gate; no response or approval is assumed. Supplemental showcase review and physical checks remain outstanding.

Latest quick verification passes lint, types and six related component tests (performance-evidence-quick-retry.log). The first attempt caught a missing optional-row guard in the ignored performance diagnostic; that diagnostic was corrected, not excluded. Production server47295 exited130 after intentional shutdown; Lighthouse39384 exited0 and cleaned its synthetic invitation. No task server remains live. Next: finish supplemental showcase review and act on the pending preview-only exception without assuming approval; keep PR68 draft meanwhile.

## Consolidated review — 2026-11-01

Finished all supplemental showcase inspection:356 slices reduce to128 byte-distinct sections, all inspected. No clipping/overlap found; development issue badges are explicitly distinguished from production evidence. REVIEW.md now records every UI checklist item; PR body rewritten around current results rather than accumulated checkpoints. Exact-zero cold-font and physical-device requirements remain unresolved. Preview exception question is unanswered. No task processes remain live. Preserve the draft and mark the ticket blocked pending the decision; continue ready backlog work instead of repeating the same measurements. Functional implementation and evidence remain pushed, not declared complete.

## Approved preview resumption — 2026-11-01

Owner explicitly approved: “Advance preview; retain exact-zero release gate.” Resumed through CLI commit ec3924f. This permits preview review after remaining checks, not a font/device pass. TICKET-201 already requires zero CLS, three-run performance coverage and physical WhatsApp verification and blocks guest releases. Preserve every failing cold-font assertion and raw measurement.

Integrated develop02c992376250d39ffc1a96a7e80a5860f3641f45. Four conflicts: home, guide, private invitation metadata and deleted opengraph-image route. Retained settings-driven pages and merged the upstream token-free /invitation-preview image metadata; accepted obsolete image-route deletion. Quick gate passes lint/types and29 related unit cases (resume-merge-quick.log). No conflict markers remain. Full browser integration is not yet verified: upstream sharing assertions currently expect fixed metadata, while209 changes page metadata dynamically. Next reconcile public metadata/image content with saved settings, add regression coverage, rebuild and run sharing/crawl/full verification. Do not claim the previous build certifies this merge.

TICKET-125 PR71 is ready for review; latest evidence commit8b58778 requires final-head CI before its authorized merge. It is no longer an active editing ticket. No other owner's checkout was modified.
