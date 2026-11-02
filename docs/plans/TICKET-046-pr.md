# Ticket

Ticket: TICKET-046

# Summary

Accepted guests can download an A5 invitation containing current wedding details and their signed, read-only entry QR. The invitation's private editing credential is excluded from the PDF.

# Changes

- Add a private authorized PDF route; reject invalid, declined and revoked invitations. Use no-store headers, a fixed download filename and generic errors.
- Render current theme colours and embedded static instances of the four existing font families. Package font files in the server trace; retain licenses and pinned provenance.
- Add keyboard-accessible light/dark download links to the existing pass component, selected through CSS without new client JavaScript.
- Add unit/browser tests, repeatable PDF raster review and font-generation tools.

# Acceptance criteria and evidence

- A5 PDFs, embedded fonts/theme metadata: focused tests pass across four themes.
- Signed QR decoding:8/8 normal and long-name samples decode after native300dpi rasterization. Native PDFKit opens the files. Actual Preview/Chrome viewer UI remains unverified.
- Generation under2s: all samples pass, including a1.10s cold render during concurrent browser load.
- Browser download, rejected eligibility, keyboard focus,44px targets, axe accessibility and all12theme/viewport screenshots pass. Screenshots inspected.

# Verification

Ten focused tests pass; production build and quick verification pass before final pagination refinement. Independent all-theme browser download test passes7.8s. Final renderer refinement has passing unit/raster checks; final production rebuild remains outstanding.

Full verify currently fails three hook tests because pnpm-lock.yaml awaits human exact-path authorization.778units pass/42skip. Broad browser smoke is running and has recorded one existing stepper30s timeout; isolated diagnostic rerun remains outstanding. No test or hook weakened.

# Risks and rollout

Draft only. Implementation currently uncommitted while lockfile authorization is pending; do not treat this as a reviewed release. No database migration. Dependency installation and server font packaging are required. Revert ticket changes to remove PDF endpoint/links. Long names can produce multiple A5 pages; QR remains unsplit. Physical print scans, WhatsApp devices, exact cold CLS and current-route Lighthouse remain unverified, with existing release gates retained.

# Screenshots

See docs/reviews/TICKET-046/{ivory-gold,midnight-champagne,emerald-night,blush-sage}/{375,768,1280}.png and REVIEW.md for per-check results. Synthetic PDF examples and raster results are local under artifacts/TICKET-046.

# UI checklist

See docs/reviews/TICKET-046/REVIEW.md. Review remains CHANGES REQUESTED pending incomplete verification. No production UI completion claimed.

## Latest review evidence

Final rebuild and download test pass. Chromium native viewer inspected successfully; Preview GUI remains unverified. Lighthouse99/99/100 performance,100accessibility each,CLS0each. All long PDF pages inspected. Broad smoke768pass/165skip/1stepper timeout; unchanged isolated stepper passes8.7s. Final full-gate rerun remains mandatory after pending lockfile authorization.
