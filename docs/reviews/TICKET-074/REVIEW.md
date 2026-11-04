# TICKET-074 UI review

2026-11-04, branch TICKET-074. The only visible change is the sent confirmation, now grouped under "From the kitchen"
and "From the bar". Screenshots come from `e2e/order-submit.spec.ts` (`RUN_ORDER_BROWSER_TESTS=1`, production build,
seeded local database plus fixtures): `<theme>/<width>-sent.png` and `-failed.png` in four themes at 375, 768 and
1280px. Fixture names are test data.

| Check                    | Result       | Evidence                                                                                                                              |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 24 captures; 375 Midnight & Champagne inspected in detail, the rest checked for layout.                                               |
| Tokens                   | PASS         | Group labels use `type-label` and `text-primary`; no literals added.                                                                  |
| Restraint and typography | PASS         | Small-caps station labels, no new decoration; the confirmation keeps one primary action.                                              |
| Mobile                   | PASS         | No horizontal scroll at every width and theme (asserted); quantities stay on one line.                                                |
| Motion                   | N/A          | No animation.                                                                                                                         |
| Keyboard                 | PASS         | No new controls. Each group is a list labelled by its heading.                                                                        |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations in the sent and failed states in every theme and width.                                                  |
| Load and images          | PASS / N/A   | No images; the grouping renders only after sending, so it cannot shift the initial layout.                                            |
| Performance              | NOT VERIFIED | Not re-measured: the change only affects the post-send view. TICKET-072's record stands (`docs/reviews/TICKET-072/performance.json`). |
| Copy                     | PASS         | Provisional: "From the kitchen", "From the bar".                                                                                      |
| Shared components        | PASS         | No new components.                                                                                                                    |
| Sharing and devices      | NOT VERIFIED | Real phones and WhatsApp remain TICKET-138/TICKET-201.                                                                                |
| QR codes                 | N/A          | No QR output.                                                                                                                         |
| Staff feedback           | N/A          | Guest page; boards are TICKET-076/077.                                                                                                |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                                    |
