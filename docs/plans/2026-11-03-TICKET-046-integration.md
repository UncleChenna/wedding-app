# TICKET-046 integration plan

Resume the owned PDF ticket against develop f5e5db58446363c6a0b4998dea3dbdfa603a43c1. Resolve only the personal invitation route and QR-pass component conflicts, retaining party details plus PDF, image and offline pass saving. No renderer changes, dependencies or migrations are required.

Extend the PDF browser regression to verify image downloading and an offline reload in the same accepted invitation. Retain every existing PDF privacy, rejection, theme, accessibility and download assertion. Recapture and inspect only TICKET-046 screenshots. Run focused tests, production build, browser integration, QR raster checks and the full gate. Preserve physical-device release checks in TICKET-201. Publish a detailed PR update; no PR77 merge exception is currently granted.
