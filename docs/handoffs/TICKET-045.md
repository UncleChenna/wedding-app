# TICKET-045 handoff

2026-11-02 — divine, codex. Branch TICKET-045; base develop be0d656343ad3d31af0f904c3a8763c6f94dc598. Start commit 6cd2dc3 pushed. Managed stack wedding-fec279d2489e, app 24370/browser 24371. TICKET-107 PR78 has passed required CI and remains in_review under human merge rules.

Implemented private /i/<token>/pass.png route, minimal name/count/read-only-QR renderer and Save image / Share image / Open image UI. Endpoint independently resolves the private capability and rechecks signed-pass eligibility. It never passes contact, dietary, table or editing-token data to the renderer. Download/share filename is generic.

Privacy finding: installed Next ImageResponse dynamically fetches missing glyphs from Google with text. This renderer converts local font glyphs to SVG paths using Next's already-bundled fontkit, then rasterizes only local vector content. No new dependency. The version-sensitive adapter is isolated and covered by actual-font PNG/QR tests. Unsupported glyphs fail locally with screenshot advice; they are never omitted silently or sent remotely. Trace manifest includes all four existing TTF assets.

Tests: initial missing-module red test recorded; seven focused tests pass, including all themes, long names, actual PNG decode, no remote requests, capability rejection and renderer field allowlist. Initial quick lint/types passes. Production build passed after correcting strict undefined test indexing. Initial production browser test passes in 7.2s, covering actual download, signature/invitation match, all-theme accessibility/screenshots and revoked/declined/unknown rejection. Full gate passed 779 unit tests (41 skipped) and 769 browser checks (165 skipped); final build and dedicated browser flow passed again in 7.5s after the fallback-copy correction. All twelve final screenshots inspected, with visible keyboard focus; long-name and all four theme PNGs inspected. Lighthouse 99/100/100, accessibility 100 and CLS 0 each. No-JavaScript Open image and native-sharing absence/cancellation pass.

The owner's standing preview exception is recorded explicitly: original manual iOS Safari/Android Chrome download requirement is retained unchecked in release-blocking TICKET-201, with WhatsApp/file sharing/physical PNG scans and non-Latin-name checks. No device pass is claimed. TICKET-201 is unowned; only this requirement was added, at the end of acceptance criteria to reduce overlap with PR78's addition.

Published PR: https://github.com/UncleChenna/wedding-app/pull/79 targets develop. Implementation e30ce76; CLI in_review transition 18f2c26. The final t:pr gate passed again (779 unit/769 browser, 41/165 skipped). Next: monitor final-head CI and retain in_review for human review; next eligible implementation is TICKET-070. Do not merge without a new explicit exception. PDF PR77 still awaits exact lockfile authorization; do not touch its files.

Lessons: locate filenames with rg --files before reading; avoid dumping minified bundled files (use bounded excerpts). This turn's first no-remote test incorrectly counted Next's local data-URL WASM load; it now permits data: while failing/recording every other requested URL. No network safeguard or feature assertion was removed.

Stop the owned isolated stack with backup after verification and end caffeinate session 69875 before yielding. Other checkouts preserved.

## 2026-11-03 integration with RSVP party and offline pass

Base develop: 51dcfe0944f3fc893abcfc9412e80057bdd03e03. Resolved the two conflicts by retaining readParty, imageHref and saveOffline together. Quick checks and production build pass. Combined real-database browser run: 3 passed in 26.3s (party editing, offline reload/eviction/revocation, signed PNG download and fallback). All 36 integration screenshots inspected across four themes and 375/768/1280; the 24 offline captures live in integration-offline/. Production Lighthouse: 99/100/100 performance, 100 accessibility and CLS 0 in all three runs. Physical devices remain an explicit TICKET-201 release gate under the existing approval.

Full gate and exact-head CI must pass before the user-authorized PR #79 merge. No dependency or migration changes. The test regenerated 24 TICKET-107 screenshots in this checkout; their pre-test backups were verified byte-identical to the merged index. New captures are preserved under TICKET-045. Cleanup was rejected by automatic approval review as cross-ticket; user approval is pending, so those files remain unstaged. No earlier edits were present.

Next: complete full verification and CI, then merge #79 with an exact-head check; integrate #80 afterward. PR #77 passed its centered-PDF full gate (769 browser checks) and is ready for review, but has no merge exception.

### Verification and cleanup completed

2026-11-03: user approved restoring the 24 test-generated TICKET-107 screenshots. Before restoring, all original backups were verified byte-identical to HEAD, and all regenerated images matched the preserved TICKET-045/integration-offline copies. Cleanup is complete; no cross-ticket working-tree changes remain. Full verification passes: 801 unit tests / 47 skips, production build, 769 browser checks / 165 skips (7.9m). Source integration is ac806d5186b132bbc55171f9721c22e2ae76a1c2, pushed. CI run 41619146241 is still running; do not merge until all required checks pass on the final review head.

Next: run t:pr to record in_review and refresh the PR description, wait for final-head CI, then perform the explicitly approved merge of PR #79 and CLI completion. Update PR #80 only afterward. No merge approval exists for PDF PR #77.
