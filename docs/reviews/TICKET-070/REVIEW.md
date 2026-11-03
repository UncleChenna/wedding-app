# TICKET-070 UI and behavior review

2026-11-03; branch TICKET-070; develop base `be0d656343ad3d31af0f904c3a8763c6f94dc598`.

The anonymous `/order` route now validates a table number and remembers the selection for this browser session. It does not open the menu or send an order (TICKET-071 and later tickets). No credentials, schema, dependencies or RLS changes.

## Evidence

- Sixteen focused unit tests pass: malformed inputs rejected before queries, normalized known selection, missing/stale selection, sanitized lookup errors, session-cookie attributes, old selection preserved on errors and failed cookie writes.
- Dedicated production browser suite: two tests pass (9.7 seconds), including native submission with JavaScript disabled. Known/unknown/empty input, focus after errors, keyboard submission, reload, changing tables, fresh-session isolation, deleted table and tampered cookie are exercised against synthetic rows in the isolated database. Fixtures are removed by ID.
- Screenshots: four themes × 375/768/1280 × entry/error/selected, under each theme directory here. All reviewed. Axe reports no violations in the error and selected matrices. No horizontal overflow; table input is at least 64px tall with 30px text. The regular screenshot command also passes all twelve cases.
- Quick verification passes lint, types and all sixteen related tests.
- Full `pnpm verify` passes: 788 unit tests (41 optional/integration tests skipped), build, and 769 browser checks (165 optional checks skipped). The opt-in live table tests were run separately and pass. Three serial production Lighthouse runs score Performance 100/100/100, Accessibility 100/100/100 and CLS 0/0/0; see `performance.json`.

## Checklist

| Item                 | Result and evidence                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS: 36 reviewed views, named `<width>-entry.png`, `<width>-error.png`, `<width>-selected.png` under each theme.                                                                                                       |
| Tokens               | PASS: theme utilities only; no new literal colours, font families, shadows or radii.                                                                                                                                    |
| Restraint/typography | PASS: single primary action; display heading, body/control text at least 16px, 24/48px separation, limited width.                                                                                                       |
| Mobile               | Browser PASS: all review widths without horizontal overflow, numeric keyboard hint, large field/button and safe-area padding. Physical keyboard/safe-area behavior remains NOT VERIFIED in release-blocking TICKET-201. |
| Motion               | PASS: reduced-motion browser coverage; no new animation or blocking transition. Existing shared controls retained.                                                                                                      |
| Keyboard             | PASS: labelled field, error text associated via aria-describedby, error focus targets the visible field, Enter submission, reachable change/back links. No dialogs.                                                     |
| Contrast             | PASS: zero axe violations in each theme's rendered error/selected states; semantic text accompanies errors.                                                                                                             |
| Load/images          | No photographs or QR changes; existing local fonts/theme shell reused. Production CLS is 0 in all three runs.                                                                                                           |
| Performance          | PASS: Performance 100/100/100 and Accessibility 100/100/100 on `/order`.                                                                                                                                                |
| Copy                 | PASS: exact PRD heading; fixed friendly error copy; honest menu-not-open state. Supporting copy is provisional Warm voice.                                                                                              |
| Shared components    | PASS: existing Input/Button reused; this feature-specific composition adds no shared primitive.                                                                                                                         |
| Sharing/devices      | NOT VERIFIED: physical WhatsApp/iOS/Android checks remain mandatory in TICKET-201 under the existing preview exception. Public metadata is inherited; no table or guest details added to previews.                      |
| QR                   | N/A: no QR output in this ticket.                                                                                                                                                                                       |
| Staff                | N/A: guest entry route only.                                                                                                                                                                                            |
| Verification         | PASS: full `pnpm verify`, 788 unit tests and 769 browser checks.                                                                                                                                                        |

## Findings and limitations

Fixed the initial streaming fallback that hid the form without JavaScript. The route follows the existing private invitation page's blocking HTML pattern. Fixed focus code that selected a hidden Server Action input. Redirect error codes now render the same error in native and enhanced submissions; no raw database messages enter URLs. Tests preserve both regressions.

The canonical dev screenshot command reported existing cached metadata URL serialization warnings; all 12 entry images were recaptured and inspected on the production build, without development overlays. No unrelated metadata/config changes are included.

A session cookie is a browser convenience, not table authorization. Future order creation must revalidate the table and menu. Browsers with session restoration may retain session cookies across restarts; this is not a security credential. A deleted table prompts reselection. Invalid URL error codes are ignored; accepted codes map to fixed copy only.

Release readiness is not approved: physical device/WhatsApp checks stay open in TICKET-201. Functional review can proceed under the user's standing preview exception with all automated gates and performance measurements passing.

## Verdict

CHANGES REQUESTED for production release: physical iOS/Android and WhatsApp checks remain unverified and mandatory in TICKET-201. Automated feature checks pass; the preview is submitted for review under the user's standing exception. PR: https://github.com/UncleChenna/wedding-app/pull/80.
