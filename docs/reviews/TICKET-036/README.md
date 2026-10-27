# TICKET-036 UI and routing evidence — 27 October 2026

Base: fdfa3ab716918a9ea3c9ed6dff088db795eeecf6. The route is a minimal personal invitation landing page; the full design remains TICKET-037, and RSVP/pass functionality remains downstream. Venue/time remain undecided. No live invitations are sent by this change.

## Routing and data

- Token/resolver tests: 20 pass, including 10,000 distinct 256-bit tokens and bounded collision retries.
- Real isolated PostgreSQL tests: two pass. Draft creation, primary-name-only projection, sent access and revoked absence; fixtures roll back. No schema changes.
- Production Playwright: eight initial cases pass across mobile/desktop. Valid token returns 200 with no-store/no-referrer/noindex headers; unknown and revoked links return identical neutral 404 UI. Reload after revocation returns 404 and no guest name. No internal IDs in guest links.
- Proxy performs only a small published-token lookup before streaming, then the page independently resolves safe content. This avoids Next's streamed soft-404 behavior. Invalid paths rewrite to a fixed unmatched URL using the existing themed not-found page. Do not create a real route at `/invitation-unavailable` without preserving this contract.
- Site-wide route inventory now includes `/i/invalid` (no database query); valid states run in the explicitly opted-in isolated database suite.

## UI checklist

| Item                   | Result and evidence                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots            | PASS: all 12 images below inspected, valid/unavailable states × ivory-gold/midnight-champagne × 375/768/1280.                                                                                                                                           |
| Tokens                 | PASS: existing semantic Tailwind tokens and font classes; no new colours, font families, radii or shadows.                                                                                                                                              |
| Restraint / typography | PASS: one text-led section, one return link, display serif couple names, 16/18px body text with relaxed line-height.                                                                                                                                    |
| Mobile                 | PASS: browser overflow checks at all three widths in both themes. Explicit tap-target checks pass on mobile and desktop; return link is at least 44×44px.                                                                                               |
| Motion                 | PASS: no new animation; reduced-motion tested throughout the screenshot/accessibility matrix.                                                                                                                                                           |
| Keyboard               | PASS: Tab from the visible heading reaches the named return link; screenshots show focus. Initial body-focus setup failed; replaced it with visible starting-point interaction and a stronger specific-link assertion. No application test was skipped. |
| Contrast               | PASS: axe WCAG A/AA checks pass in both themes and both states; existing theme token contrast gate remains intact.                                                                                                                                      |
| Load / images          | No new images. Existing next/font configuration reused; CLS=0 assertion passes on mobile and desktop production runs.                                                                                                                                   |
| Performance            | NOT VERIFIED: no Lighthouse installation available in this checkout. This remains release QA under TICKET-201 and the user's preview-with-separate-QA authorization; no >=95 claim.                                                                     |
| Copy                   | PASS: approved Warm subline, confirmed names/date, honest TBD venue/time and pending RSVP/pass text. New supporting copy is provisional until full invitation design.                                                                                   |
| Shared components      | PASS: existing theme/layout and not-found page reused; feature component is specific to invitations and adds no general UI primitive.                                                                                                                   |
| Sharing / devices      | NOT VERIFIED: WhatsApp preview and physical iOS/Android checks remain TICKET-201. Metadata is generic and contains no guest names; HTTP noindex/no-referrer are tested.                                                                                 |
| QR codes               | N/A: no QR output.                                                                                                                                                                                                                                      |
| Staff feedback         | N/A: no staff UI.                                                                                                                                                                                                                                       |
| Verification           | Pending final complete gate. Initial gate: 301 unit/DB passes, build passed; 173 browser passes and 17 conditional skips, two missing route-inventory failures now corrected.                                                                           |

Review outcome: automated routing and accessibility evidence passes; final gate and disclosed release QA remain. This is not wedding-day release approval.

## Screenshots

- [unavailable-ivory-gold-1280.png](unavailable-ivory-gold-1280.png)
- [unavailable-ivory-gold-375.png](unavailable-ivory-gold-375.png)
- [unavailable-ivory-gold-768.png](unavailable-ivory-gold-768.png)
- [unavailable-midnight-champagne-1280.png](unavailable-midnight-champagne-1280.png)
- [unavailable-midnight-champagne-375.png](unavailable-midnight-champagne-375.png)
- [unavailable-midnight-champagne-768.png](unavailable-midnight-champagne-768.png)
- [valid-ivory-gold-1280.png](valid-ivory-gold-1280.png)
- [valid-ivory-gold-375.png](valid-ivory-gold-375.png)
- [valid-ivory-gold-768.png](valid-ivory-gold-768.png)
- [valid-midnight-champagne-1280.png](valid-midnight-champagne-1280.png)
- [valid-midnight-champagne-375.png](valid-midnight-champagne-375.png)
- [valid-midnight-champagne-768.png](valid-midnight-champagne-768.png)

Recovery run: all 301 unit/DB tests and build pass, 181 browser passes, 18 conditional skips; one new fixture-status mismatch fixed. The invalid-token fixture now explicitly requires 404 and still runs its overflow assertion; targeted rerun passes. Final complete gate is next.
