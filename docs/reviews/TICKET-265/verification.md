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

## Online card numbering — 17 November

Owner reserves 001–150 for hard-copy invitations. New online allocations start at 151;
20 consecutive successful creations use 151–170. There is no artificial 20-invitation cap.
Generated migration 0042 changes identity START and advances its current counter to at least
150, preserving all existing card numbers and any higher consumed sequence value. Sequence
gaps remain intentional: rolled-back/deleted invitations never cause number reuse.

Isolated PostgreSQL: 20 allocations returned151–170, unique; synthetic rows rolled back.
Existing id/number pairs unchanged; repeating migration retained the higher counter.
Drizzle migrate twice had identical row/migration counts; all30 public tables retain RLS.
Two invitation repository database tests pass, including new numbers>=151.
Local main database had no card_number column: applied additive pending0039–0042 through
Drizzle, verified guest/invitation counts unchanged and next online allocation151. Existing
records received historical identifiers from0041 and are not renumbered by0042. No production
application or reset. To roll back application code, retain the sequence floor and existing
identifiers; never lower/recycle the sequence.

## Country-code phone input — 19 November

Guest and plus-one phone fields now pair a native country-code dropdown with a local number.
New fields default to Nigeria +234; saved international values infer their existing code.
Common codes are listed, with Other country accepting a complete international number.
No location lookup, permission prompt, external service or dependency is introduced.
The form still submits a single international memberPhone value; blank optional numbers remain
blank, pasted international numbers are recognized, and Italy's significant zero is retained.
UK-specific helper/error wording was removed from this form.

Quick verification passed:32 related tests,14 database tests skipped. Focused tests cover
Nigeria normalization, country switching, persisted UK numbers, blank fields, international
paste and unlisted codes. Browser checks at375/768/1280 pass without overflow; the guest and
plus-one both default toNigeria and UK selection submits+44. Screenshots included. Physical
devices and all theme variants not reverified for this incremental form change.

## Guest-page UI redesign — 19 November

Reworked guest-list hierarchy: prominent add action, secondary guest tools, invitation/attendance
counts, searchable list and expandable filters. Removed obsolete Side filtering/display. Guest
rows have smaller names, less duplicate information and direct Edit guest links. The form uses
one contained surface, two desktop columns, compact section headings and shorter guidance;
primary guest, plus-one, country-code input and save/preview/send behavior remain intact.
Mobile admin navigation now uses one scrollable row instead of covering four rows of content;
desktop sidebar remains. Bottom content clearance matches the shorter bar.

Quick verification:13 related tests passed. Root preview types passed. Twelve screenshots cover
list/form at375/768/1280 in light/dark; no horizontal overflow. Both mobile routes in both modes
have zero axe violations. Filters/reset, add navigation and Nigeria defaults exercised in the
browser. Source review found no blocking regressions. Existing future opportunity: auto-scroll
later active mobile navigation links into view. Physical devices, all additional palettes and
fresh performance measurements remain unverified; prior build security blocker is unchanged.

## Add invitation modal — 19 November

Removed Seating plan from Guest tools. Add an invitation now opens the shared native-dialog
sheet with the guest form; the full-page URL remains available for direct links. Saving keeps
preview/send controls in the same modal. Closing refreshes the list and returns focus to its
trigger. Nested card/share dialogs own Escape and Tab events rather than closing/trapping the
parent. Modal form omits redundant navigation and nested card borders.

Quick verification passed175 tests. Browser verified no seating link, modal375/768/1280,
synthetic invitation save, nested preview/share, Escape leaving the parent open and final
focus restoration with URL still /admin/guests. No message sent. Screenshots included.
Print gate list remains the printable confirmed-guest backup with arrival tick boxes; opening
it does not send invitations or record admission automatically.

## Compact phone selector and responsive modal — 19 November

Country code now occupies6.5rem alongside the phone input at every width, with one visible
phone label and distinct accessible labels for both controls. Options put the dial code first;
Nigeria remains the default. The modal uses dynamic viewport height, scroll containment and
horizontal desktop margins. Browser measurements after viewport layout settled passed at
320x568,375x812,768x1024,1280x800,667x375 and375x400: dialog inside viewport, no horizontal
overflow, code<=110px, controls aligned and submit reachable by scrolling. Axe:zero violations.
Quick verification:nine tests passed. Physical keyboard/device behavior remains unverified.
