# TICKET-166 UI review — preview release gates retained

2026-11-06. Routes: /admin, /admin/event-closure; downloadable memories PDFs.
Historical automated evidence follows. Current disposition (2026-11-09): the owner authorizes preview progress while physical-phone keyboard, safe-area and PDF/CSV download checks stay unchecked in release-blocking TICKET-201. Current integration quick checks pass lint, types and 324 related tests (89 skipped); new-head CI and any required focused integration reruns remain pending. No device result is claimed.

- PASS (component tests): control-room navigation reaches the closure page; page
  authorization precedes settings reads. PDF and CSV are native download links
  without prefetch. Missing venue timezone disables closure.
- PASS (component tests): typed confirmation and unchecked evidence acknowledgment
  are required; success/refusal uses a live status region; successful closure
  disables further submission. Inputs retain their controlled state on refusal.
- PASS (source review): shared button/input/checkbox components, theme tokens,
  server-rendered page with a minimal client form, explicit Server Action auth,
  only event date and eligibility passed to the client. No personal aggregate rows
  or credentials are serialized into the form. React review found no effects,
  unnecessary memoization or client data-fetching waterfall.
- PASS: authenticated browser closure, download boundaries, existing gate/kitchen/bar
  session rejection and preserved admin access. All12 theme/width screenshots in
  artifacts/TICKET-166/screenshots were captured and inspected. AA scans and
  horizontal-overflow checks pass at375/768/1280 in all four themes.
- PASS: keyboard tab order, Space toggling, visible focused-button outline and
  minimum44px target geometry in all theme/width variants. Four additional mobile
  viewport captures show the focused action above the bottom navigation; all four
  inspected. Reduced-motion interaction passes. Three fresh authenticated browser
  contexts measure exactly0 CLS after fonts and network settle at375/768/1280.
- NOT VERIFIED: physical-phone on-screen keyboard/safe-area and download behavior.
  Owner standing authorization resolves the preview-only approval blocker; the exact physical checks remain mandatory in TICKET-201.
- N/A: page photography, QR codes and staff scanner feedback; none changed here.
  No new animation; reduced-motion browser interaction passes.
- PASS: full gate (1076 unit passes/99 conditional skips,851 browser passes/195
  skips), real database closure/idempotency, session rejection and ordering
  concurrency. Concurrency observes PostgreSQL lock contention, retains the accepted
  order and rejects the next order after closure. Quick lint/types pass afterward.
- PDF: all four themed samples and the seven-page long menu pass native PDFKit
  extraction and the A4/page-number/privacy checks in scripts/verify-memories-pdf.swift.
  First pages of all themes and all seven long-menu pages visually inspected. Fixed
  missing page-number output discovered by native review. Six renderer tests and
  quick gate pass. The long-menu rows and page numbers remain readable without clipping;
  authenticated browser downloads now pass; device downloads remain unverified.

The earlier managed database rehearsal completed after the user-approved backup-preserving stop
of TICKET-048. The database is not being started for the current integration until the shared slot is available. All database/browser evidence uses this ticket's isolated environment.
No production event closure or real-device verification is claimed.
