# TICKET-046 review — 2026-11-03

The user confirmed the sample opens correctly in macOS Preview and requested a centered QR and caption. That layout change is implemented: all eight signed samples have QR ink centered within 0.5 raster pixels of page center at 300dpi. Caption centering and all 12normal/long PDF pages were visually reviewed across four themes. See each theme's `pdf.png`, `pdf-long-1.png`, `pdf-long-2.png` and `centered-qr.json`.

The exact-path lockfile authorization is now recorded and generated lockfile committed in72f8872; frozen installation passes. No protected guard was bypassed. The pre-alignment full gate passes 781unit tests/42skips, build and 769browser tests/165skips. After centering:10 focused tests, quick verification, production build and the real PDF download/privacy browser test pass (7.4s). Full publication gate is repeated before advancing review.

| Checklist item       | Evidence                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS: all four themes at 375/768/1280 for the download controls;12native PDF pages reviewed after alignment.                                                         |
| Tokens               | PASS: active theme colours/fonts and QR ink/paper; no new theme tokens.                                                                                              |
| Restraint/typography | PASS: A5 invitation hierarchy, embedded display/body fonts,12pt print body, centered QR/caption. Long names flow to a second page without splitting QR/caption.      |
| Mobile               | Browser PASS: no overflow,44px link targets and keyboard focus. Physical devices remain NOT VERIFIED in TICKET-201.                                                  |
| Motion               | PASS: no PDF animation/new client code; reduced-motion browser checks retained.                                                                                      |
| Keyboard             | PASS: download links reached with visible focus in every theme.                                                                                                      |
| Contrast             | PASS: all-theme browser axe checks; QR theme ink/paper contrast and unobstructed four-module quiet zone retained.                                                    |
| Load/images          | PASS: no website layout change; prior current-route production CLS0/0/0. PDF is a document, not a web photograph.                                                    |
| Performance          | PASS: prior current-route Lighthouse99/99/100, accessibility100each. All 8centered PDF generations remain below2s.                                                   |
| Copy                 | PASS: approved PRD invitation and QR wording; no technical error leaks.                                                                                              |
| Shared components    | PASS: existing pass composition; no new shared interactive primitive.                                                                                                |
| Sharing/devices      | NOT VERIFIED: physical WhatsApp/iOS/Android remains release-blocking201. User confirmed Preview opening on 2026-11-03; Chromium native viewer was visually verified. |
| QR                   | PASS automated: all 8signed samples independently decode after 300 dpi native rasterization. Physical print scans remain NOT VERIFIED in TICKET-201.                 |
| Staff                | N/A: guest document/download only.                                                                                                                                   |
| Verification         | Full gate passes before the requested alignment; focused/build/browser checks pass after it. Publication reruns the full gate.                                       |

CHANGES REQUESTED for production release only: physical-device/print QA remains mandatory in TICKET-201. Functional preview may proceed under the standing user exception after the publication gate passes. No production readiness claim.

## Earlier review history (superseded where noted above)

# TICKET-046 review — in progress

Base develop be0d656343ad3d31af0f904c3a8763c6f94dc598; 2026-11-02.

- PASS: four themes render A5 with embedded TrueType faces and metadata naming theme/fonts. No editing token in PDF. Static fonts derived from hash-pinned official sources. Installed react-pdf4.9.0.
- PASS: 8/8 signed QR samples decode independently after native 300 dpi rasterization; normal1page/long2pages. Generation9–95ms for synthetic samples, below2s. No physical print/device certification.
- PASS: native PDFKit opens all samples and extracts text. Actual Preview/Chrome viewer UI opening not yet verified; browser download is verified.
- PASS: download/privacy browser test7.8s; no-store, safe filename, accepted-only authorization, declined/revoked/malformed404.
- PASS: screenshots at 375/768/1280 in all 4themes, all 12 inspected. Focus visible,44px link target, no horizontal overflow, axeA/AA reports no violations. Reduced-motion browser mode used; no new motion/client code.
- PASS: existing theme tokens and font roles; print body12pt corresponds16CSSpx. Shared pass component reused; approved PRD subline/QR wording used.
- PASS: production build; all 4font assets in route trace; quick lint/types/relatedtests.
- NOT VERIFIED: exact CLS, current-route Lighthouse, real iOS/Android WhatsApp and print scans, Preview/Chrome application viewer. Existing201 release gate retained; do not claim full UI completion.
- NOT PASSING: full verify blocked by protected lockfile authorization (778units pass/42skip;3hook assertions fail at authorization guard). No guard bypass. Browser smoke running separately.
- N/A: staff feedback, photo changes, new dialog patterns. PDF is static; existing website fonts/images remain unchanged.

CHANGES REQUESTED pending remaining verification and approval. Raw local evidence: artifacts/TICKET-046/{review.json,qr-results.json,verify.log,build.log,browser.log,smoke.log}. Scripts reproduce font generation, sample exports, native rasterization and QR decoding. Browser screenshots are in this directory by theme.

## Updated evidence

Final build passes; final browser download/privacy matrix passes12.1s. Chromium native PDF viewer rendering visually verified (chromium-pdf.png); Preview GUI not verified. All long PDF pages inspected;8/8 final PDFs decode at 300 dpi. Latest timings47–1096ms while browser smoke loaded the machine. Lighthouse99/99/100 performance,100accessibility each,CLS0each. This does not certify the separate release-blocking cold-font/device issues.

Broad smoke records768pass/165skip/1stepper timeout; isolated unchanged stepper passes8.7s. Full gate remains incomplete pending authorization and rerun. No tests or hooks weakened.

## Develop integration — 2026-11-03

Integrated develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1 in c5e4f41, resolving personal-route and QR-pass conflicts. Party details, PDF downloading, image downloading and offline saving all remain available. No PDF renderer, migration, dependency or lockfile changes were needed. The requested centered PDF layout is unchanged.

Fifteen focused tests and production build pass. Extended real-browser regression passes in 12.3 seconds, covering all existing PDF privacy/theme/download checks plus image downloading and offline reload from the same invitation. All 12 updated pass screenshots were inspected across four themes and three widths. Existing 8 signed PDF raster samples decode again at 300 dpi; those samples were not regenerated because renderer/font/QR generation is unchanged. Integrated production Lighthouse scores: 97/98/98 performance, 100 accessibility and CLS 0 each; see integration-performance.json.

Full t:pr verification and renewed CI remain required. Physical-device/printed-scan release gates remain in TICKET-201. PR77 is mergeable, but no merge exception has been granted. Stack wedding-e435bc566586 was stopped with backup while idle, then restarted for isolated verification. TICKET-042 is in_review at PR81; final CI is pending. Another agent is actively working on TICKET-071; do not edit that worktree.
