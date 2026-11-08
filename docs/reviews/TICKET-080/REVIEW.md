# TICKET-080 UI review

2026-11-04, branch TICKET-080. `<theme>/<width>-closed.png` (from `e2e/ordering-closed.spec.ts`) shows the guest order
page for a confirmed table while ordering is closed, in four themes at 375, 768 and 1280px. The admin switch on the
control room page is covered by the signed-in `e2e/admin-menu.spec.ts`.

| Check                    | Result       | Evidence                                                                                                          |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 12 captures; 375 Midnight & Champagne inspected in detail.                                                        |
| Tokens                   | PASS         | `font-display`, body text and shared `Button` only; no literals.                                                  |
| Restraint and typography | PASS         | One message and one sentence; no form or button while closed. Admin text is 18px.                                 |
| Mobile                   | PASS         | No horizontal scroll at every width and theme (asserted).                                                         |
| Motion                   | N/A          | No animation; the switch between views is instant.                                                                |
| Keyboard                 | PASS         | No new guest controls; the admin switch is a native button with a status line.                                    |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations in the closed state in every theme and width. Open and closed are words, not colour. |
| Load and images          | PASS         | The closed state is server-rendered from settings, so there's no flash of the menu.                               |
| Performance              | NOT VERIFIED | Not re-measured; the closed view is lighter than the menu.                                                        |
| Copy                     | PASS         | Provisional: "The menu opens soon", "Ordering opens after the couple's entrance…", and the admin switch lines.    |
| Shared components        | PASS         | Shared `Button`; no new pattern.                                                                                  |
| Sharing and devices      | NOT VERIFIED | Real phones and WhatsApp remain TICKET-138/TICKET-201.                                                            |
| QR codes                 | N/A          | No QR output.                                                                                                     |
| Staff feedback           | PASS         | The admin switch reports its result immediately in a status line.                                                 |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                |
