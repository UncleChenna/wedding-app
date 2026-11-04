# TICKET-095 UI review

2026-11-04, branch TICKET-095. Screenshots come from `e2e/admin-menu.spec.ts`, signed in as a real admin (email code
plus TOTP) on this worktree's local Supabase. `<theme>/<width>-menu.png` covers four themes at 375, 768 and 1280px,
scrolled to a fixture item. Fixture names ("TICKET-095 fixture …") are test data.

| Check                    | Result       | Evidence                                                                                                                                                             |
| ------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 12 captures; 375 Blush & Sage and 1280 Emerald Night inspected in detail. Category headings changed from singular ("MEAL") to the guest menu's plurals after review. |
| Tokens                   | PASS         | Shared `Button`, `Input`, `Select`, `Textarea`; `type-label`, `font-display`, `text-muted-foreground`, `border-border`; no literals.                                 |
| Restraint and typography | PASS         | One list and one add form; admin body text is `text-lg` (18px) per the staff/admin rule; the state is a short word.                                                  |
| Mobile                   | PASS         | No horizontal scroll at every width and theme (asserted); every button is at least 44px (shared `Button`); the shell bar keeps the last content clear.               |
| Motion                   | N/A          | No animation added. The test disables transitions during theme checks, because edit forms in closed `<details>` never finish theirs.                                 |
| Keyboard                 | PASS         | Native forms, buttons and `<details>`; buttons are named with the item ("Mark sold out: …"); on a refused submit, focus moves to the first invalid field (asserted). |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations, one full scan per theme. Available and sold out are words, not colour.                                                                 |
| Load and images          | N/A          | No images. Photos are deferred: there's no column.                                                                                                                   |
| Performance              | N/A          | Admin screen.                                                                                                                                                        |
| Copy                     | PASS         | Provisional: intro line, "Mark sold out", "Mark available", "Remove item", the in-use refusal and field messages (`menuAdminCopy`).                                  |
| Shared components        | PASS         | Shared form components only.                                                                                                                                         |
| Sharing and devices      | NOT VERIFIED | Real phones for admin release QA (TICKET-206).                                                                                                                       |
| QR codes                 | N/A          | No QR output.                                                                                                                                                        |
| Staff feedback           | PASS         | Each action reports in its own status line; the toggle's label flips immediately after the refresh.                                                                  |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                                                                   |
