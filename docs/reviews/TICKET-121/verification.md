# Verification — TICKET-121

2026-11-13. Worktree base develop fe97f5f8; isolated native PostgreSQL33841.

- `pnpm typecheck`:pass.
- `pnpm build`:pass.
- `RUN_GUEST_QUALITY_PROOF=all pnpm exec playwright test e2e/guest-quality-proof.spec.ts --project=mobile --workers=1`: exits1 with exactly3deliberate failures. Each fails in the fixture's `quality.issues` assertion after the offending popup navigates and closes. Reported kinds are `console.error`, `pageerror`, and `layout-shift`; the latter has value0.005274434438180105 on `/invite`.
- The shift proof independently observes a positive non-input shift before asserting fixture rejection. It waits700ms before mutation so the browser's recent-input grace period cannot invalidate the proof. An earlier too-early mutation produced no qualifying shift; it is not counted as rejection evidence.
- `pnpm exec tsx scripts/test-guest-journey.ts` with this worktree's database:4passed7.8s. Both projects exercise real table selection/menu/order receipt and the existing open/accept/companion/meal/pass-image/PDF/return/edit/lock journey. The default context and created pass tab are observed.

No guest text, private link, pass token or console message body is included in quality attachments. Staff routes and intentional application-error journeys are outside this positive-path fixture's scope. Unsupported layout-shift observation or a missing observer fails closed.

Review follow-up: the public entry flow also visits actual `/invite`, `/lost-link` and `/offline` before ordering. The shared route registry classifies `/gate-recovery` as staff, so it remains intentionally excluded. The reviewer found no blocker.

## Cold-font placeholder repair

The new cold-font check reproduced existing guest 404 shifts with fonts delayed 2.5 seconds. Desktop light moved the heading horizontally (CLS 0.0000792539); dark moved the eyebrow/description (0.0000647945). Reserving full-width boxes alone did not eliminate movement of centered glyphs. At 375px the fallback heading also occupied two lines while the final font occupied one, moving subsequent content 45px (0.0120164891).

The shared placeholder now reserves its text widths. Its default alignment remains centered; only the guest 404 opts into left alignment. The 404 heading is one text node with an intentional mobile newline and normal desktop whitespace. Keeping one text node matters: splitting it around a responsive `br` produced a separate desktop fragment that moved during the font swap. No font, color token, content, animation or CLS threshold changed.

Final production checks: eight light/dark guest 404 and staff-entry cases at 375px/1280px passed in 27.3 seconds, plus four at 768px in 14.2 seconds. All report exactly zero non-input CLS and no horizontal overflow. Screenshots are in `placeholders/`; mobile light and desktop dark were visually inspected. Independent review found no blocking source issue. The dedicated 404 regression intentionally uses the base fixture because an HTTP 404 is an expected response, not a positive guest-journey console failure.

Build passes. Focused verification passed lint, types and five related unit tests. Physical-device checks and release Lighthouse measurements remain outside this local evidence; no broader all-route or all-device zero-CLS claim is made. CI screenshot outputs default to ignored artifacts, preventing generated-image changes from invalidating verification fingerprints.

Final accessibility-enhanced regression: eight 375px/1280px cases passed in 29.4 seconds, with zero WCAG A/AA axe violations on every case; CLS and overflow assertions remain unchanged. Tablet screenshots/geometry were verified separately as above.
