# Ticket

Ticket: TICKET-039

# Summary

The personal invitation now opens with a skippable 600ms envelope reveal. The letter and RSVP are readable and usable immediately, including without JavaScript. Returning browsers bypass the automatic reveal.

# Changes

- Added a small client envelope using existing theme colours, shared Monogram and Button.
- Animate only transform and opacity; controls use 180ms underline feedback. Reduced motion removes movement, including when the preference changes during opening.
- Preserve keyboard focus when Skip opening becomes Replay opening. Storage failures do not block content; the local flag contains no guest data.
- Keep the invitation preview readable in ordinary browsers without JavaScript.
- Stabilize control width and monogram glyph positions to prevent layout shifts. Initial wrappers in the shared Monogram preserve its other renderings.

# Acceptance criteria and evidence

- 600ms transform/opacity reveal and 180ms control feedback: asserted in e2e/envelope.spec.ts.
- Reduced motion: no reveal animation in all four themes at 375/768/1280; live preference changes verified.
- Keyboard: RSVP anchor remains reachable during opening; skip/replay retains focus.
- First/return behavior and storage denial: unit and browser coverage; content never waits for animation.

# Verification

- 15 focused unit tests pass; 42 focused envelope/shared-decoration browser tests pass across mobile and desktop.
- Saved RSVP: three live tests plus one configured-details/no-JavaScript test pass.
- All 12 theme/width RSVP reviews pass, including initial, yes, no, error and closed states; axe, overflow and 44px targets checked for each state.
- All 72 mobile overflow tests pass in isolation.
- Full CI passed source head de25c37 in run41218305039. A fresh serial local full gate is running; its final result will be recorded before promotion.
- An earlier local full run had 554 browser passes,135 skips and five trace-file ENOENT failures because two Playwright runs shared test-results. The unchanged affected suites passed serially. No assertion or timeout was weakened.

# Risks and rollout

No migrations, dependencies or external services added. First visit is per browser, not an identity signal. Clearing storage allows another automatic reveal; denied storage can cause it on subsequent visits. Rollback is a source revert. Physical iOS/Android WhatsApp checks remain unverified; the owner approved proceeding to review on 2026-10-31 while retaining them in release-blocking TICKET-201.

Base develop: e381c810bc19404d7ded59a6155fc8977c1f474d.

# Screenshots

Reviewed evidence: docs/reviews/TICKET-039 contains 12 full preview layouts,12 motion frames,12 shared decoration captures and60 live RSVP captures. All four themes at375/768/1280 are covered. See its README.md, browser-review.json and performance.json.

# UI checklist

- PASS screenshots: all96 captures inspected; no clipping or layout regression.
- PASS tokens: existing primary/background, display font and motion tokens.
- PASS restraint/typography: one decorative envelope, existing letter hierarchy and approved copy.
- PASS mobile: no horizontal overflow; all interactive targets at least44px; no new input or keyboard-resizing behavior.
- PASS motion:600ms reveal,180ms controls,transform/opacity only,reduced motion disables movement.
- PASS keyboard: invitation and RSVP remain usable during animation; focus retained.
- PASS contrast: all-theme axe including hover. Text stays opaque; only underline fades.
- PASS load:CLS0 across12 production layouts and three Lighthouse runs; no photo added.
- PASS performance: mobile Lighthouse99/99/100 Performance and100 Accessibility in all three serial real-invitation runs.
- PASS copy: approved invitation copy retained; Skip opening / Replay opening are concise controls.
- PASS shared components: Button/Monogram reused;12 shared showcase captures reviewed.
- NOT VERIFIED sharing/devices: physical iOS/Android WhatsApp checks remain release-gated; owner explicitly approved proceeding to review while retaining this release gate on 2026-10-31.
- N/A QR: no QR output changed.
- N/A staff: no staff behavior changed.
- Verification: source CI passes; serial local gate result pending.

# Harness changes, if any

None. Handoff records that Playwright invocations sharing test-results must run serially. Prior interrupted/failed runs remain documented.
