# TICKET-046 review — in progress

Base develop be0d656343ad3d31af0f904c3a8763c6f94dc598; 2026-11-02.

- PASS: four themes render A5 with embedded TrueType faces and metadata naming theme/fonts. No editing token in PDF. Static fonts derived from hash-pinned official sources. Installed react-pdf4.9.0.
- PASS: 8/8 signed QR samples decode independently after native300dpi rasterization; normal1page/long2pages. Generation9–95ms for synthetic samples, below2s. No physical print/device certification.
- PASS: native PDFKit opens all samples and extracts text. Actual Preview/Chrome viewer UI opening not yet verified; browser download is verified.
- PASS: download/privacy browser test7.8s; no-store, safe filename, accepted-only authorization, declined/revoked/malformed404.
- PASS: screenshots at375/768/1280 in all4themes, all12 inspected. Focus visible,44px link target, no horizontal overflow, axeA/AA reports no violations. Reduced-motion browser mode used; no new motion/client code.
- PASS: existing theme tokens and font roles; print body12pt corresponds16CSSpx. Shared pass component reused; approved PRD subline/QR wording used.
- PASS: production build; all4font assets in route trace; quick lint/types/relatedtests.
- NOT VERIFIED: exact CLS, current-route Lighthouse, real iOS/Android WhatsApp and print scans, Preview/Chrome application viewer. Existing201 release gate retained; do not claim full UI completion.
- NOT PASSING: full verify blocked by protected lockfile authorization (778units pass/42skip;3hook assertions fail at authorization guard). No guard bypass. Browser smoke running separately.
- N/A: staff feedback, photo changes, new dialog patterns. PDF is static; existing website fonts/images remain unchanged.

CHANGES REQUESTED pending remaining verification and approval. Raw local evidence: artifacts/TICKET-046/{review.json,qr-results.json,verify.log,build.log,browser.log,smoke.log}. Scripts reproduce font generation, sample exports, native rasterization and QR decoding. Browser screenshots are in this directory by theme.

## Updated evidence

Final build passes; final browser download/privacy matrix passes12.1s. Chromium native PDF viewer rendering visually verified (chromium-pdf.png); Preview GUI not verified. All long PDF pages inspected;8/8 final PDFs decode at300dpi. Latest timings47–1096ms while browser smoke loaded the machine. Lighthouse99/99/100 performance,100accessibility each,CLS0each. This does not certify the separate release-blocking cold-font/device issues.

Broad smoke records768pass/165skip/1stepper timeout; isolated unchanged stepper passes8.7s. Full gate remains incomplete pending authorization and rerun. No tests or hooks weakened.
