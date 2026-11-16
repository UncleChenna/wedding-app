# Original invitation card review

## Owner decision and assets

The owner supplied `YOUR INVITE 🌸.pdf` and chose “Preserve design; personalise number and RSVP”.
The original is retained in `src/modules/invitations/assets/card/original.pdf`. Its two pages
were rendered locally with PDFKit to the adjacent PNGs, without changing the artwork. HTML and
PDF overlays replace only the original 003 and phone/SMS RSVP block. The artwork palette is
kept as an asset token file; website themes never recolour the supplied card.

The personalised download has the two card pages plus a separate RSVP sheet with a large QR.
This keeps the artwork uncluttered and the code readable. It is an RSVP/editing capability,
not a gate credential. The existing signed entry-pass download is labelled separately.
The web page repeats event details in readable HTML and retains maps and dress code.

## Verification

- `pnpm verify`: format, lint, types, 2161 tests passed (241 skipped), production build passed.
- Final `pnpm verify:quick` after label/test updates: lint, types, 236 related tests passed
  (190 skipped). Includes direct admin route authorization-before-data tests.
- Four real PostgreSQL identity/constraint tests pass; repeat migrations/counts and 30-table
  RLS check pass. See `card-number-migration.md` for migration scope and evidence.
- Mobile and desktop committed Playwright preview tests: 2 passed.
- Twelve decoded-image screenshots: four themes at 375/768/1280. Inspected mobile and PDF
  pages; no horizontal overflow. Axe reports zero violations for all four 375px previews.
- Native PDFKit rendering confirms three pages and correct personalised text. `jsqr` decoded
  the third-page QR to the expected sample RSVP URL. Physical printing/scanning not verified.
- Against the isolated production build and synthetic database: published guest sees the
  numbered card and downloads its private PDF before RSVP; PDF contains the household's
  own RSVP URL. Draft/revoked downloads return 404. Anonymous admin download is denied.
- The first database-backed test used a port different from the compiled site URL; rerun at
  the configured port passed. A redundant test server exhausted the deliberately small DB
  pool; stopping only that owned server allowed status checks to pass. No other stack changed.
- Independent review found missing map/dress-code details and ambiguity in the older design
  editor. Both were corrected and re-reviewed.

## Remaining / release notes

Apply migration 0039 before deploying code that reads card numbers. It backfills existing rows;
numbers are permanent and must be retained during rollback. It was not applied to the main
checkout or a real guest database. The localhost:3000 sample preview was integrated separately
without changing its database or overwriting unrelated local work.

Real phones, WhatsApp attachment delivery and physical print scans remain unverified. Sharing
still sends a personal invitation link; opening a preview or downloading a file does not send
anything or record a share. The sample PDF intentionally points to example.com.

The printed ceremony/reception/date are fixed to the supplied source. The 17 December reply
request does not change the existing RSVP lock policy. Previously published photo/headline
settings do not replace this fixed artwork; the admin editor now says so explicitly.
