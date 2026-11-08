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

- `pnpm verify`: passed before the final embedded layout correction; 1,091 unit tests passed / 107 skipped; 851 browser smoke tests passed / 195 skipped. Lint, types and build passed.
- `pnpm exec tsx scripts/test-theme-editor.ts`: passed before that correction; authenticates with OTP/TOTP and asserts zero Axe violations and no horizontal overflow in 24 combinations.
- Final correction keeps the narrow embedded invitation single-column, preserving normal public-page breakpoints. Final quick verification, production rebuild and focused browser regression all passed.
- Review corrections: quick verification passed; six isolated publication database tests passed, including stale draft rejection without changing the live selection. The authenticated browser journey passed in 27.8 seconds, including two-tab conflict/reload/activation, keyboard focus, no embedded development links, guest SSR and all 24 Axe/overflow combinations.
- Latest local broad run: lint/types/build passed; 1,095 unit tests passed/108 skipped. Smoke: 837 passed/195 skipped/14 desktop failures during local database unavailability. Independent `/p/invalid` returned HTTP 503; invitation/pass and PWA return checks saw the retry screen. All 14 failed checks passed unchanged in a serial rerun (21.0s) after the database became healthy. The initial broad command remains recorded as failed; the review CLI will rerun the full gate. The subsequent action-boundary regression passed (eight action tests total).
- Physical-device, fresh Lighthouse and exact-zero CLS checks remain unverified. No claim of full UI completion.

# Risks and rollout

No migration, dependency, CI, account or production-data change. Requires the already merged TICKET-181 schema/service. The editor manages the `wedding-light`/`wedding-dark` draft pair; preset-only texture paths are omitted when copying to custom IDs. Publication affects guests on their next page load. Restore a known-good preset through existing Settings if needed; reverting this UI does not delete saved theme data. Base verified: develop `2706b96ddd0c7fa12c2e499f302d7e21e3108fde`.

# Screenshots

24 PNGs: `docs/reviews/TICKET-098/screenshots/<theme>-<invitation|order>-<375|768|1280>.png`. Four registered themes, both previews, three widths. Corrected invitation captures inspected at all three widths; order captures inspected before the invitation-only correction.

# UI checklist

Detailed PASS/N/A/not-verified evidence: `docs/reviews/TICKET-098/ui-review.md`. Device and fresh performance/CLS checks are not verified; the user authorized progression through review while retaining these release gates. TICKET-201 remains release-blocking.

# Harness changes, if any

No harness changes. The opt-in local test runner supplies a synthetic admin allowlist and uses only this worktree's isolated Auth/database. It refuses to overwrite existing editor draft IDs and restores fixture selection after the test.
