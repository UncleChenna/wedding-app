# TICKET-166 UI review — incomplete

2026-11-06. Routes: /admin, /admin/event-closure; downloadable memories PDFs.
Disposition: CHANGES REQUESTED until the outstanding verification below is complete.

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
- NOT VERIFIED: keyboard/focus/tap-target geometry, safe-area positioning, cold-font
  CLS and physical-device behavior. Full-page mobile screenshots include the fixed
  bottom navigation at the original viewport boundary; viewport-level checks must
  still confirm focused controls remain unobscured. No final UI approval.
- N/A: page photography, QR codes and staff scanner feedback; none changed here.
  No new animation; inherited motion/reduced-motion still needs browser review.
- PASS: full gate (1076 unit passes/99 conditional skips,851 browser passes/195
  skips), real database closure/idempotency, session rejection and ordering
  concurrency. Concurrency observes PostgreSQL lock contention, retains the accepted
  order and rejects the next order after closure. Quick lint/types pass afterward.
- PDF: all four themed samples and the seven-page long menu pass native PDFKit
  extraction and the A4/page-number/privacy checks in scripts/verify-memories-pdf.swift.
  First pages of all themes and the final long-menu page visually inspected. Fixed
  missing page-number output discovered by native review. Six renderer tests and
  quick gate pass. Not every middle long-menu page was visually inspected;
  authenticated browser downloads now pass; device downloads remain unverified.

The managed database is now healthy after the user-approved backup-preserving stop
of TICKET-048. All database/browser evidence uses this ticket's isolated environment.
No production event closure or real-device verification is claimed.
