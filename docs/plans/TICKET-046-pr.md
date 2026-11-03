# Ticket

Ticket: TICKET-046

# Summary

Accepted guests can download a themed A5 invitation with current event details and their signed read-only entry QR. The private invitation editing credential never enters the PDF. The QR and its caption are centered across the page, as requested during Preview review.

# Changes

- Private authorized PDF endpoint with no-store responses, fixed download filename and friendly errors; declined, revoked and invalid invitations cannot download.
- Embedded static instances of the four approved font families, theme colours and vector QR with four-module quiet zone. Long names paginate while the QR/caption stays together.
- Keyboard-accessible light/dark PDF links in the existing pass component.
- Ticket-approved react-pdf dependency and generated lockfile, explicitly authorized by the user on 2026-11-03. No database migration or RLS changes.
- Unit/browser tests and native 300 dpi sample/raster/decoding helpers; screenshots and review evidence.

# Acceptance criteria and evidence

- Native opening: user confirmed macOS Preview displays the sample correctly on 2026-11-03; Chromium native PDF viewer visually verified. PDFKit opens all 8samples. All 8signed QR samples decode after 300 dpi rasterization.
- Themes/fonts: focused assertions inspect theme/font metadata and embedded fonts across all 4themes. All 12normal/long PDF pages visually reviewed; centered QR ink is within 0.5 raster pixels of page center in all 8signed samples.
- Speed: every centered sample generates below 2 seconds; measurements in the review artifacts.

# Verification

- Frozen lockfile installation passes with the approved generated lockfile.
- Full `pnpm verify` after authorization passes 781unit tests (42 optional skips), build and 769browser checks (165 optional skips).
- After the requested centering refinement:10 focused PDF tests, `verify:quick`, production build and real download/privacy/browser matrix pass (7.4 seconds). The publication CLI repeats full verification before moving this PR to review.
- Previous current-route Lighthouse:99/99/100 Performance,100 Accessibility each,CLS0each; page DOM was not changed by PDF centering.
- Base develop be0d656343ad3d31af0f904c3a8763c6f94dc598. Integrate later invitation changes sequentially and verify the combined result before merge.

# Risks and rollout

Install the approved locked dependencies; deployment tracing includes all four PDF fonts. No migration. Revert this ticket to remove PDF downloads. Very long names create multiple A5 pages, with the code/caption kept intact.

Physical WhatsApp/iOS/Android and printed scans remain NOT VERIFIED in release-blocking TICKET-201 under the user's standing preview exception. The user confirmed Preview manually after macOS denied automation access; no permission bypass was attempted. No production UI readiness claim. This PR is not included in the separate authorization to merge #76/78/79/80.

# Screenshots

[Detailed review](https://github.com/UncleChenna/wedding-app/blob/TICKET-046/docs/reviews/TICKET-046/REVIEW.md). Each theme directory includes375/768/1280download controls and centered `pdf.png`, `pdf-long-1.png`, `pdf-long-2.png`. Local PDFs: artifacts/TICKET-046/<theme>.pdf.

# UI checklist

Every item is recorded in the detailed review. Automated layout, typography, contrast, keyboard, copy, QR decoding and performance pass. Physical sharing/devices/print checks remain unverified and release-blocking. Staff feedback is not applicable.

# Harness changes, if any

No hooks, rules, tests or guardrails weakened. The ignored exact-path approval records the user's actual authorization; it is not committed.
