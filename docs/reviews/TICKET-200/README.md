# TICKET-200 UI review

26 October 2026. APPROVE for the labelled preview under the user's explicit preview-merge exception. Release performance and physical-device checks remain in TICKET-201.

| Check                | Result and evidence                                                                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS: 48 state captures in screenshots/, eight states × two themes × 375/768/1280. Six contact sheets and the full mobile quantity-error screen inspected. Repository screenshot command also passed 12 captures for /dev and /dev/order. |
| Tokens               | PASS: existing theme variables and shared controls; search found no literal colours, custom radii, shadows or font families in feature code.                                                                                              |
| Restraint/typography | PASS: single menu column, serif headings, body and labels at least 16px, restrained separators and existing spacing.                                                                                                                      |
| Mobile               | PASS: no horizontal overflow; links and controls meet 44×44 targets. Menu scrolls naturally without fixed elements covering inputs. Physical keyboard/device checks remain in TICKET-201.                                                 |
| Motion               | PASS: reduced-motion browser mode exercised; no new animations.                                                                                                                                                                           |
| Keyboard             | PASS: Enter continues the form, invalid fields receive focus, each new step focuses its heading. Back and table/theme changes preserve selections.                                                                                        |
| Contrast             | PASS: axe scans each captured state in both themes. Errors, availability and status have text labels.                                                                                                                                     |
| Load/images          | No images added; existing font setup retained. Release CLS/load certification is not verified and remains in TICKET-201.                                                                                                                  |
| Performance          | Not verified for release; explicitly deferred to TICKET-201 under user approval.                                                                                                                                                          |
| Copy                 | PASS: approved menu and received/served wording reused. Sample rules and non-submission are explicit. Other guidance copy remains provisional.                                                                                            |
| Shared components    | PASS: Button, Input, Select, Textarea and QuantityStepper reused. No new shared primitive.                                                                                                                                                |
| Sharing/devices      | Noindex developer route, no guest share link; physical WhatsApp iOS/Android checks remain unverified in TICKET-201.                                                                                                                       |
| QR                   | N/A: no QR output or credentials.                                                                                                                                                                                                         |
| Staff feedback       | N/A: guest sample status only; no scanner or staff action.                                                                                                                                                                                |
| Verification         | PASS: quick/full gates; 242 unit tests, 155 browser passes and 17 conditional skips; 12 screenshot-command checks. PR workflow repeats the full gate.                                                                                     |

## Integration boundary

Sample tables 1–30, quantities 0–10, note length 200 and menu availability are demonstration rules. Zod rejects invalid tables, fractional/negative/excessive quantities, unavailable/unknown items and empty orders. Browser tests cover filters, errors, table changes, theme changes, review, received/served, restart and reload. Mutation-request capture asserts no POST/PUT/PATCH/DELETE requests. All state stays in React memory; no real order, persistence, authentication, inventory or kitchen/bar delivery exists.

Managed worktree setup could not start its local Supabase stack. This preview performs no database I/O and passed with public example configuration. Database readiness and integration tests are not claimed.
