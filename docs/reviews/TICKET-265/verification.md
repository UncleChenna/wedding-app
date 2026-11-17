# TICKET-265 verification

Guest and plus-one share an invitation and table. Guest editing/import no longer collect or
persist a household label. Readers derive names from guests. The nullable legacy database
column and compatible internal DTO fields remain; no real data was deleted or migrated.
Historical six-column import digests are recognized to avoid duplicate re-imports.

The cards page is now labelled Printable table signs, explains A6 printing and placement,
and explicitly distinguishes signs from invitations/place cards. The shared QR opens ordering;
guests choose their table there. Responsive columns now respect the available content width.

## Results

- Full verification: formatting, lint, types and 2,199 unit tests passed (243 skipped).
  Production build BLOCKED by installed Next.js SecurityFatalError; no bypass applied.
- Final verify:quick passed after review fixes.
- Targeted editor/import: 44 unit/UI/action tests and 14 isolated database tests passed.
- Seating/invitation repositories: six isolated database tests passed.
- Review fixes: unknown scan IDs retain null rather than misleading Guest; long aggregated names
  are bounded in gate-conflict responses. Real-database regression and 37 related tests passed.
- Browser: authenticated seating and signs at 375/768/1280, light/dark; 12 screenshots.
  No horizontal overflow or page errors. Guest names shown, legacy label absent.
  Both mobile sign variants have zero axe violations. QR decodes to local /order.
  Print media hides controls and keeps QR visible; generated PDF. Guest form has no household input.
- Local main-checkout preview updated with three-way merges, preserving unrelated edits; types passed.

## UI review limits

Screenshots reviewed; reduced-motion preference used. Existing mobile admin navigation is fixed
at the viewport bottom and overlays part of full-page captures; content remains scrollable.
Physical devices, physical print scan, Lighthouse, every registered palette, and full keyboard
journeys were not verified. This is not full release QA approval. Build security blocker remains.

## Guest input clarification — 17 November

Restored a distinct Guest name input at the top, backed by the primary guest record,
with email/phone alongside it. Named guests is now Plus one; companions are listed below
and can be added/removed without removing the primary guest. Form submission order remains
primary guest first, preserving IDs and saved details. Six form tests and an authenticated
mobile add/remove check pass; screenshot included. No database field or migration required.

## Send from confirmation — 17 November

The saved-invitation screen now offers inline personalised card preview and a Send invitation
button using the existing tracked share menu. Admin authorization and UUID validation precede
credential reads; previewing never records sending. Failed loading can be retried without
recreating the invitation. Card data is read directly for drafts (public draft links are inactive).
Older local databases without card numbering show an explicit unavailable message rather than
an invented number. No migration or outbound message is performed here.

Quick verification passed (14 related tests); two authorization/input tests also passed.
Authenticated browser check created a synthetic invitation in the isolated database, loaded
both artwork images, opened the card panel and then the sharing menu. No message was sent.

## Blank preview repair

Opened the supplied PDF using the local PDF renderer and verified SHA-256 matches the project's
original.pdf byte-for-byte. Preview now displays the original two-page artwork when a local
record has no personal card number, instead of withholding all artwork. Personalised cards keep
the existing number/RSVP overlays. Images load directly without the optimizer/blur placeholder.
Open original PDF serves an exact byte-for-byte copy of the supplied document.
Quick verification passed (24 related tests); three preview component tests including missing
number fallback passed. Authenticated browser loaded both images and the send menu successfully.
