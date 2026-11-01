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
