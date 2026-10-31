# Ticket

TICKET-207 — Make cold font builds deterministic

# Summary

Intermittent CI failures originate in Next's virtual Google-font asset resolver. Bundled, licensed fonts now load through next/font/local, avoiding that resolver and external build-time downloads. The failure was observed in CI but not deterministically reproduced locally; this bypass does not claim to repair the compiler.

## Changes

- Pinned official source revision, original OFL licenses, hashes and documented conversion process.
- Small primary Latin assets and on-demand complete character coverage; existing public variables, metric fallbacks, swap, weights and preload policy preserved.
- Inter optical size 14 matches the former loader default.
- Actual font metadata/coverage tests and browser checks for no-JavaScript rendering, local-only requests, non-Latin loading and identical sample rasterization at three weights.
- Documented FONT_COLD_BUILD=1 uses Next's filesystem-cache configuration without deleting generated files.

# Acceptance criteria and evidence

Three final cold production builds pass. Five asset unit tests and 16 targeted browser cases pass. Sixty capture cases cover five routes, four themes and 375/768/1280 widths; reviewed sheets and index are in docs/reviews/TICKET-207. Full pnpm verify passed: 494 unit tests / 26 skips, build, 533 browser tests / 135 skips. CI41238775314 passed on7c2f73c9ad97dfe2873d7962457f149f6fb3f7b3; subsequent review-documentation commits receive their own CI.

# Verification

Full pnpm verify passed: 494 unit tests / 26 skips, production build and 533 browser tests / 135 skips. Three cold builds and sixteen targeted browser cases passed. See docs/reviews/TICKET-207 for measurements and visual evidence.

Verified base: fd91e877e29b32ef911acfd45036ad65767732c7.

## UI evidence and limitations

See docs/reviews/TICKET-207/README.md for every checklist item and retained measurement JSONs. Home and RSVP score 100/100/100 for performance and accessibility. Invitation scores 90/93/93 (baseline 89/94/94), accessibility 100, CLS zero. It remains below the 95 release threshold. Homepage retains tiny intermittent CLS (~0.00007339), not a strict zero. Physical WhatsApp/iOS/Android testing is unverified; TICKET-201 retains release QA. This PR does not certify launch readiness.

# Risks and rollout

Build and visit /dev/theme, /dev/invitation and /dev/rsvp; compare themes and inspect local font requests. Check the committed screenshot sheets and provenance. No migration, root dependency or CI change. Revert the ticket's changes to restore the old Google loader if necessary; that also restores exposure to the intermittent resolver failure.

## Approved review disposition

On 2026-10-31 the user approved proceeding to review with the performance, strict zero-CLS and physical-device limitations retained in release-blocking TICKET-201. Measurements and thresholds are unchanged. No release certification or merge is implied.
