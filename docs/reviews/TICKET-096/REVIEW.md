# TICKET-096 UI review

2026-11-05, branch TICKET-096. Screenshots come from `e2e/admin-staff.spec.ts`, signed in as a real admin.
`<theme>/<width>-pin.png` shows a staff member right after a PIN is issued, with the one-time PIN panel, in four themes
at 375, 768 and 1280px. Fixture names are test data.

| Check                    | Result       | Evidence                                                                                                                       |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Screenshots              | PASS         | 12 captures; 375 Ivory & Gold inspected in detail. The phone bar now holds 5 sections, with Sign out in the header.            |
| Tokens                   | PASS         | `bg-surface-muted`, `border-border`, `rounded-md`, `type-label`, `font-display`, `font-mono`; no literals.                     |
| Restraint and typography | PASS         | One list and one add form; the PIN at 36px with letter spacing for reading aloud; admin text 18px.                             |
| Mobile                   | PASS         | No horizontal scroll at every width and theme (asserted); 44px buttons (shared `Button`).                                      |
| Motion                   | N/A          | No animation.                                                                                                                  |
| Keyboard                 | PASS         | Native forms and buttons, named with the person ("Issue PIN: …"); a refused add focuses the invalid field.                     |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations, one scan per theme. PIN state is in words ("No PIN yet", "PIN works until …", "Access removed"). |
| Load and images          | N/A          | No images.                                                                                                                     |
| Performance              | N/A          | Admin screen.                                                                                                                  |
| Copy                     | PASS         | Provisional: the intro, the state lines, the one-time PIN warning, and the time-zone and event-over refusals (`staffCopy`).    |
| Shared components        | PASS         | Shared form components; the PIN panel is specific to this page.                                                                |
| Sharing and devices      | NOT VERIFIED | Real phones for admin release QA (TICKET-206).                                                                                 |
| QR codes                 | N/A          | No QR output.                                                                                                                  |
| Staff feedback           | PASS         | Each action reports straight away; the PIN panel is announced as a status.                                                     |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                             |
