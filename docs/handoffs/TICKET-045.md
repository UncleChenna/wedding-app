# TICKET-045 handoff

2026-11-02 — divine, codex. Branch TICKET-045; base develop be0d656343ad3d31af0f904c3a8763c6f94dc598. Start commit 6cd2dc3 pushed. Managed stack wedding-fec279d2489e, app 24370/browser 24371. TICKET-107 PR78 has passed required CI and remains in_review under human merge rules.

Implemented private /i/<token>/pass.png route, minimal name/count/read-only-QR renderer and Save image / Share image / Open image UI. Endpoint independently resolves the private capability and rechecks signed-pass eligibility. It never passes contact, dietary, table or editing-token data to the renderer. Download/share filename is generic.

Privacy finding: installed Next ImageResponse dynamically fetches missing glyphs from Google with text. This renderer converts local font glyphs to SVG paths using Next's already-bundled fontkit, then rasterizes only local vector content. No new dependency. The version-sensitive adapter is isolated and covered by actual-font PNG/QR tests. Unsupported glyphs fail locally with screenshot advice; they are never omitted silently or sent remotely. Trace manifest includes all four existing TTF assets.

Tests: initial missing-module red test recorded; seven focused tests pass, including all themes, long names, actual PNG decode, no remote requests, capability rejection and renderer field allowlist. Initial quick lint/types passes. Production build passed after correcting strict undefined test indexing. Initial production browser test passes in 7.2s, covering actual download, signature/invitation match, all-theme accessibility/screenshots and revoked/declined/unknown rejection. Full gate passed 779 unit tests (41 skipped) and 769 browser checks (165 skipped); final build and dedicated browser flow passed again in 7.5s after the fallback-copy correction. All twelve final screenshots inspected, with visible keyboard focus; long-name and all four theme PNGs inspected. Lighthouse 99/100/100, accessibility 100 and CLS 0 each. No-JavaScript Open image and native-sharing absence/cancellation pass.

The owner's standing preview exception is recorded explicitly: original manual iOS Safari/Android Chrome download requirement is retained unchecked in release-blocking TICKET-201, with WhatsApp/file sharing/physical PNG scans and non-Latin-name checks. No device pass is claimed. TICKET-201 is unowned; only this requirement was added, at the end of acceptance criteria to reduce overlap with PR78's addition.

Next: commit/push verified implementation and evidence, run mandatory t:pr, monitor final-head CI and retain in_review for human review. Do not merge without a new explicit exception. PDF PR77 still awaits exact lockfile authorization; do not touch its files.

Lessons: locate filenames with rg --files before reading; avoid dumping minified bundled files (use bounded excerpts). This turn's first no-remote test incorrectly counted Next's local data-URL WASM load; it now permits data: while failing/recording every other requested URL. No network safeguard or feature assertion was removed.

Persistent caffeinate session 69875 prevents machine sleep during verification; stop when ending. Other checkouts preserved.
