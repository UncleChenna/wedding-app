# TICKET-207 handoff

2026-10-31. Owner divine; agent codex; branch TICKET-207.
Base fd91e877e29b32ef911acfd45036ad65767732c7; project wedding-fd74b69b0c2f; app 37710/browser 37711.
Draft PR: https://github.com/UncleChenna/wedding-app/pull/63.

## Result

Pinned local fonts bypass the intermittent Google virtual-asset resolver failure. Source logs identify NextFontGoogleFontFileReplacer; unchanged local baseline passed, so deterministic reproduction is not claimed. Original OFL licenses and provenance are committed. Inter optical size is pinned at 14. The final registry uses small primary subsets plus on-demand complete faces; existing variables, metric fallbacks, styles, weights and swap remain. No dependency, CI, token or schema edits.

Initial full-font loading regressed invitation performance to 77/79/79. Final primary subsets preserve the baseline OpenType features and reduce Latin font downloads to approximately the baseline 156 KB. Browser pixel and width comparisons pass for five faces at 400/500/600. Complete files retain other characters; non-Latin loading is tested.

## Evidence

Five asset unit tests; 16 focused browser cases; 60 screenshot capture cases across five routes, four themes, 375/768/1280. Final sheets/index and performance JSONs are committed under docs/reviews/TICKET-207. Initial sheets and final changed slices inspected; no visible typography regression. 375/436 image files have identical raw pixels to the initial capture; 61 changed, including spinner phases.

Three final FONT_COLD_BUILD=1 builds pass (final-cold-1/2/3.log); no generated output deleted. Quick verification passed. Final pnpm verify passed: 494 unit tests / 26 skips, production build, 533 browser tests / 135 skips (3.9 minutes). Session15332 exited0; final-verification.log records the result. Final documentation format check also passed. Earlier full gate passed492unit/26skip and525browser/135skip before final optimization. Earlier CI41235696720 passed on5fda1af; final optimized head requires new CI.

Performance: home100/100/100 and RSVP100/100/100, accessibility100. Invitation90/93/93 versus baseline89/94/94, accessibility100, CLS0. Homepage has tiny intermittent CLS~0.00007339. Physical WhatsApp/iOS/Android unverified. Release performance/device checks remain in TICKET-201; do not claim strict UI completion or launch readiness.

## Next actions

Finish full gate, push final assets/evidence, await final-head required CI, then apply ticket criteria/status only for proven checks. No merge authorized under latest AGENTS. Current PR remains draft pending verification/disposition of explicit UI limits.

User approved TICKET-103 coverage clarification: document TICKET-113 manifest/HTTPS/worker checks and TICKET-114 real-device checks as mandatory downstream obligations, not certified by103. Apply after handing off207; do not fabricate device results.

Supabase is running for this isolated project; stop with backup after tests finish. Owned production review servers have stopped. Use current worktrees for ticket commands because primary coordination checkout lacks newer definitions.

## Tooling lessons

Next's bundled fontkit cannot reliably inspect variable WOFF2 outlines; real-browser raster comparisons supply the proof instead. Evaluate image-heavy guest routes and retained baseline, not only homepage Lighthouse. Explicit-path Python writes avoid the current shell-hook false positives on structured patch payloads.

## 2026-10-31 — review disposition authorized

User approved proceeding to review with TICKET-201 release gates retained. CI41238775314 passed on7c2f73c9ad97dfe2873d7962457f149f6fb3f7b3. The earlier pending-CI/disposition notes are resolved. TICKET-103 clarification has also been applied and PR61 is in review. Current action: record proven ticket criteria and approval, run normal t:pr gate, mark PR63 ready for human review and stop owned stack with backup. Do not merge or certify release checks.
