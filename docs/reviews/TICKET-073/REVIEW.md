# TICKET-073 UI review

2026-11-04, branch TICKET-073. The visible change is two new refusal messages in the order page's sticky action bar.
Screenshots come from `e2e/order-submit.spec.ts` (`RUN_ORDER_BROWSER_TESTS=1`, production build, seeded local database
plus fixtures): `<theme>/<width>-cooldown.png` shows an immediate second order refused with the wait in seconds, in four
themes at 375, 768 and 1280px.

| Check                    | Result       | Evidence                                                                                                   |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 12 captures; 375 Ivory & Gold inspected in detail.                                                         |
| Tokens                   | PASS         | No styling changes; messages reuse the `ActionBar` status line.                                            |
| Restraint and typography | PASS         | One sentence, no new decoration; Send stays the only primary action.                                       |
| Mobile                   | PASS         | No horizontal scroll at every width and theme (asserted); the message sits above the thumb-reach button.   |
| Motion                   | N/A          | No animation.                                                                                              |
| Keyboard                 | PASS         | No new controls; the status line is announced politely.                                                    |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations in the cooldown state in every theme and width.                               |
| Load and images          | N/A          | No load-time change; no images.                                                                            |
| Performance              | NOT VERIFIED | Not re-measured; only post-submit text changed.                                                            |
| Copy                     | PASS         | Provisional: the cooldown message with its seconds, and "Your table already has a few orders on the way…". |
| Shared components        | PASS         | No new components.                                                                                         |
| Sharing and devices      | NOT VERIFIED | Real phones and WhatsApp remain TICKET-138/TICKET-201.                                                     |
| QR codes                 | N/A          | No QR output.                                                                                              |
| Staff feedback           | N/A          | Guest page.                                                                                                |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                         |
