# Ticket

Ticket: TICKET-046

# Summary

Accepted guests can download a themed A5 invitation with current event details and their signed read-only entry QR. The private invitation editing credential never enters the PDF. The QR and its caption are centered across the page, as requested during Preview review.

# Changes

- Private authorized PDF endpoint with no-store responses, fixed download filename and friendly errors; declined, revoked and invalid invitations cannot download.
- Embedded static instances of the four approved font families, theme colours and vector QR with four-module quiet zone. Long names paginate while the QR/caption stays together.
- Keyboard-accessible light/dark PDF links alongside image downloading and offline saving in the existing pass component.
- Ticket-approved react-pdf dependency and generated lockfile, explicitly authorized by the user on 2026-11-03. No database migration or RLS changes.
- Unit/browser tests and native 300 dpi sample/raster/decoding helpers; screenshots and review evidence.

# Acceptance criteria and evidence

- Native opening: user confirmed macOS Preview displays the sample correctly on 2026-11-03; Chromium native PDF viewer visually verified. PDFKit opens all 8samples. All 8signed QR samples decode after 300 dpi rasterization.
- Themes/fonts: focused assertions inspect theme/font metadata and embedded fonts across all 4themes. All 12normal/long PDF pages visually reviewed; centered QR ink is within 0.5 raster pixels of page center in all 8signed samples.
- Speed: every centered sample generates below 2 seconds; measurements in the review artifacts.

# Verification

- Integrated develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1 in c5e4f41; PDF, image, offline saving and party details are retained together.
- Fifteen focused tests and production build pass after integration. The extended PDF browser regression passes in 12.3 seconds, including actual image download and offline reload in addition to all prior PDF privacy and rejection assertions.
- All 12 refreshed screenshots inspected. Existing eight signed PDF samples still decode at 300 dpi; renderer/font/QR generation is unchanged, so those samples were not regenerated.
- Integrated production Lighthouse: Performance 97/98/98, Accessibility 100 each, CLS 0 each. See docs/reviews/TICKET-046/integration-performance.json.
- Earlier pre-integration full verification passed. The renewed full t:pr gate and CI remain pending before review status is restored.

# Risks and rollout

Install the approved locked dependencies; deployment tracing includes all four PDF fonts. No migration. Revert this ticket to remove PDF downloads. Very long names create multiple A5 pages, with the code/caption kept intact.

Physical WhatsApp/iOS/Android and printed scans remain NOT VERIFIED in release-blocking TICKET-201 under the user's standing preview exception. The user confirmed Preview manually after macOS denied automation access; no permission bypass was attempted. No production UI readiness claim. This PR is not included in the separate authorization to merge #76/78/79/80.

# Screenshots

[Detailed review](https://github.com/UncleChenna/wedding-app/blob/TICKET-046/docs/reviews/TICKET-046/REVIEW.md). Each theme directory includes375/768/1280download controls and centered `pdf.png`, `pdf-long-1.png`, `pdf-long-2.png`. Local PDFs: artifacts/TICKET-046/<theme>.pdf.

# UI checklist

Every item is recorded in the detailed review. Automated layout, typography, contrast, keyboard, copy, QR decoding and performance pass. Physical sharing/devices/print checks remain unverified and release-blocking. Staff feedback is not applicable.

# Harness changes, if any

No hooks, rules, tests or guardrails weakened. The ignored exact-path approval records the user's actual authorization; it is not committed.
