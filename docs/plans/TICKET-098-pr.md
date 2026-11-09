# Ticket

Ticket: TICKET-098

# Summary

Admins can now edit a light/dark theme pair at `/admin/themes`, preview invitation and table ordering pages, save private drafts, and publish both appearances together. Previously the publication service existed without an editor.

# Changes

- Add a dashboard Themes link and a Settings editor link behind existing two-factor admin access.
- Provide preset selection, named colour pickers/hex inputs, curated heading/body fonts and separate light/dark drafts.
- Reuse TICKET-181 save/activate actions and published snapshots. Invalid drafts show named contrast pairs; unsaved or invalid pairs cannot activate.
- Scope draft styles to embedded existing preview components. Preserve CSP frame restrictions and public component defaults.
- Add helper tests and a real OTP/TOTP database-backed browser journey, including reload persistence and fresh no-JavaScript guest HTML after activation.
- Reject activation when another administrator saved different tokens after the displayed draft was loaded. Compare normalized reviewed tokens inside the publication transaction after row locking; no partial publication or cache invalidation on rejection.
- Keep embedded invitation previews inside the editor and focus the order heading after user-initiated step transitions without stealing initial editor focus.

# Acceptance criteria and evidence

The authenticated journey proves invalid saves create no draft, valid saves remain unpublished, reload preserves font/name choices, and activation changes both server-rendered guest appearances without deployment. Source and screenshots are in `docs/reviews/TICKET-098/`; the latest review-regression journey passed in 27.8 seconds.

# Verification

- Forced `pnpm t:pr TICKET-098 --force-verify` passed the complete gate on integrated develop `407fb68db4dde004cf0868274a744ebd435dbbb2`: ticket/format/lint/type checks, 1,106 unit tests passed / 118 skipped, production build, 851 mobile/desktop smoke tests passed / 195 skipped (8.7 minutes).
- Six isolated publication database tests passed after integration, including rejection of stale reviewed tokens without changing the live selection. Both inherited migration runs succeeded with identical post-run counts; all 20 public tables retain RLS.
- Authenticated OTP/TOTP editor journey passed (27.8s): invalid save, draft persistence, two-tab stale-publication rejection, reload/activation, fresh no-JavaScript guest HTML, no embedded development links, initial editor focus and ordering step-heading focus.
- All 24 palette/preview/width Axe and overflow combinations passed; screenshots were refreshed. A separate review found no remaining blockers in the corrections.
- Earlier broad verification encountered a confirmed local database outage (HTTP 503), with 14 failures. All 14 passed unchanged after recovery; a second outage-interrupted run was also retained. The final complete run above passed after an idle owned stack was stopped with its backup preserved. No assertions or timeouts were relaxed.
- Physical-device, fresh Lighthouse and exact-zero CLS checks remain unverified in release-blocking TICKET-201. The standard typography smoke assertion does not certify fresh theme-studio CLS measurements.

# Risks and rollout

No new migration, dependency, CI, account or production-data change introduced by this feature. Requires the already merged TICKET-181 schema/service. The editor manages the `wedding-light`/`wedding-dark` draft pair; preset-only texture paths are omitted when copying to custom IDs. Publication affects guests on their next page load. Restore a known-good preset through existing Settings if needed; reverting this UI does not delete saved theme data. Base for final verification: develop `407fb68db4dde004cf0868274a744ebd435dbbb2`.

# Screenshots

24 PNGs: `docs/reviews/TICKET-098/screenshots/<theme>-<invitation|order>-<375|768|1280>.png`. Examples: [Ivory desktop invitation](https://github.com/UncleChenna/wedding-app/blob/TICKET-098/docs/reviews/TICKET-098/screenshots/ivory-gold-invitation-1280.png), [Emerald mobile order](https://github.com/UncleChenna/wedding-app/blob/TICKET-098/docs/reviews/TICKET-098/screenshots/emerald-night-order-375.png). Four registered themes, both previews, three widths. The initial set was reviewed across all widths. After the review corrections, all 24 captures were refreshed with Axe/overflow checks; the replacement Ivory desktop invitation and Emerald mobile order examples were inspected.

# UI checklist

Detailed PASS/N/A/not-verified evidence: `docs/reviews/TICKET-098/ui-review.md`. Device and fresh performance/CLS checks are not verified; the user authorized progression through review while retaining these release gates. TICKET-201 remains release-blocking.

# Harness changes, if any

No harness changes. The opt-in local test runner supplies a synthetic admin allowlist and uses only this worktree's isolated Auth/database. It refuses to overwrite existing editor draft IDs and restores fixture selection after the test.

## Current develop integration

Integrated `407fb68db4dde004cf0868274a744ebd435dbbb2` without conflicts. The seven
inherited migration artifacts (0016–0018, their snapshots and journal) match
fetched develop exactly. Applied only to TICKET-098's isolated database: both
migration runs succeeded, post-run row counts match exactly, and all 20 public
tables have RLS enabled. No reset or new migration was introduced. The final
review gate passed against this integrated base; earlier outage evidence is retained.

## 2026-11-09 workflow integration

Integrated develop `37e9202cca611c0c9d68b5749340066ab4e2ce97` without conflicts.
This adds the reviewed TICKET-217/218 harness improvements; application source
is unchanged from the independently reviewed, fully verified implementation.
The updated workflow requires local quick verification and full CI for this
routine integration. Local quick verification passed (lint, types and related
tests), and all 20 focused publication/action regressions passed. Earlier full local, database and browser evidence above
is retained with its original base; no fresh database startup or device claim
is made. All five checks on the new final head are still required before merge.
