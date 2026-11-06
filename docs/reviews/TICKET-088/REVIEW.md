# TICKET-088 UI review

2026-11-04, branch TICKET-088. Screenshots come from `e2e/admin-shell.spec.ts` against `/dev/admin`, which renders the
real `AdminShell` with sample content, because admin sign-in needs a local Auth stack that wasn't available.
`<theme>/<width>.png` covers four themes at 375, 768 and 1280px. They are viewport captures, so the fixed phone bar
shows where it really sits.

| Check                    | Result       | Evidence                                                                                                                                                    |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 12 captures; 375 Ivory & Gold and Emerald Night, and 1280 Midnight & Champagne, inspected.                                                                  |
| Tokens                   | PASS         | `bg-surface-muted`, `bg-background`, `border-border`, `text-primary`, `type-label`, `font-display`; no literals.                                            |
| Restraint and typography | PASS         | One navigation, text labels only, small-caps title over the display-serif event name.                                                                       |
| Mobile                   | PASS         | Bar pinned to the viewport bottom with safe-area padding; last content scrolls clear of it; every link at least 44×44; no horizontal scroll (all asserted). |
| Motion                   | N/A          | No animation.                                                                                                                                               |
| Keyboard                 | PASS         | Tab reaches Control room, Sharing and Sign out in order with a visible outline; Enter follows the link (asserted). The current page has `aria-current`.     |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations in every theme and width.                                                                                                      |
| Load and images          | N/A          | No images; staff and admin screen.                                                                                                                          |
| Performance              | N/A          | Admin screen, not a guest page.                                                                                                                             |
| Copy                     | PASS         | "Wedding control room", "Control room", "Sharing", "Sign out"; preview copy says it's sample-only.                                                          |
| Shared components        | PASS         | Shell-specific; no new shared pattern.                                                                                                                      |
| Sharing and devices      | NOT VERIFIED | Real phones remain for release QA.                                                                                                                          |
| QR codes                 | N/A          | No QR output.                                                                                                                                               |
| Staff feedback           | N/A          | Navigation only.                                                                                                                                            |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                                                          |
