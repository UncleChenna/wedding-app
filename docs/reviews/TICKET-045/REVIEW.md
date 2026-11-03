# TICKET-045 image-pass review

Base: develop be0d656343ad3d31af0f904c3a8763c6f94dc598. Synthetic isolated invitations only.

## Checks

| Item                 | Evidence                                                                                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | Four themes x 375/768/1280 captured by e2e/pass-image.spec.ts; all final captures inspected. Four actual themed PNG artifacts inspected at phone scale.                                                                                                              |
| Tokens               | PNG uses registered background, foreground, primary and QR ink/paper; local display/body font files match theme tokens. Controls reuse Button and theme utilities.                                                                                                   |
| Typography/restraint | One pass and one primary save action. PNG heading 96px and body 48px on a 1080px canvas (33px/16.7px at 375px display width); label 36px. Long names wrap without truncation.                                                                                        |
| Mobile               | Browser overflow/44px checks pass. Save/status block sits beneath the pass; no new form or keyboard. Physical safe-area/Photos handling unverified.                                                                                                                  |
| Motion               | No custom animation; reduced-motion run. Existing Button reused without loading spinner.                                                                                                                                                                             |
| Keyboard             | Visible focus captured; download button and open-image link accessible. Browser cancellation preserves the ready status.                                                                                                                                             |
| Contrast             | Axe checks pass in all themes; PNG uses contrast-validated QR and text tokens. Meaning is not color-only.                                                                                                                                                            |
| Load/images          | Generated PNG is a functional pass; no photo or new web font. Online status block reserves height. Three production Lighthouse runs report CLS 0.                                                                                                                    |
| Performance          | PASS: production Lighthouse Performance 99/100/100, Accessibility 100 each.                                                                                                                                                                                          |
| Copy                 | Approved pass wording reused; concise saving/failure/hold-to-save guidance. No server detail exposed.                                                                                                                                                                |
| Shared components    | Existing QrPass/Button/QR helper reused. Feature-specific save control is not a general component.                                                                                                                                                                   |
| Sharing/devices      | Physical iOS Safari, Android Chrome and WhatsApp NOT VERIFIED; retained in TICKET-201 under the existing preview exception. Generic file/title; no private invitation URL sent via share.                                                                            |
| QR                   | Actual PNG decode in all themes and production download signature/invitation match pass. Four-module quiet zone retained, integral module scaling. Physical camera scans NOT VERIFIED.                                                                               |
| Staff feedback       | N/A: no scanner/staff action changed.                                                                                                                                                                                                                                |
| Verification         | PASS: seven focused tests; pnpm verify passes 779 unit tests (41 skipped), production build and 769 browser tests (165 skipped), plus validation/format/lint/types. Final dedicated browser flow passes in 7.5s, including visible focus and no-JavaScript fallback. |

## Limitations and release requirements

The PNG contains name and party size plus the required read-only signed QR and generic instructions. No table, contact, meals or editing capability. It is private/no-store and not indexed.

Only locally supported font glyphs are exported. Unsupported names produce a friendly error with screenshot advice, rather than leaking text to an external font service or silently altering it. The pinned Next fontkit adapter must be retested on upgrades; existing TTF fonts are traced in the production bundle. Physical device/save/non-Latin-name checks remain mandatory in TICKET-201.

Preview review does not certify guest release. Downloaded files cannot be remotely erased; scanners still validate current admission rights. Browser download behavior cannot prove that a guest saved into Photos.

Preview review: APPROVE under the standing device-QA exception. Physical manual results remain NOT VERIFIED in TICKET-201; neither release gate is removed. Final screenshot correction replaced inaccurate “below” guidance with the actual Open image label.

## 2026-11-03 integration with RSVP party and offline pass

Base develop: 51dcfe0944f3fc893abcfc9412e80057bdd03e03. Resolved the two conflicts by retaining readParty, imageHref and saveOffline together. Quick checks and production build pass. Combined real-database browser run: 3 passed in 26.3s (party editing, offline reload/eviction/revocation, signed PNG download and fallback). All 36 integration screenshots inspected across four themes and 375/768/1280; the 24 offline captures live in integration-offline/. Production Lighthouse: 99/100/100 performance, 100 accessibility and CLS 0 in all three runs. Physical devices remain an explicit TICKET-201 release gate under the existing approval.

Full gate and exact-head CI must pass before the user-authorized PR #79 merge. No dependency or migration changes. The test regenerated 24 TICKET-107 screenshots in this checkout; their pre-test backups were verified byte-identical to the merged index. New captures are preserved under TICKET-045. Cleanup was rejected by automatic approval review as cross-ticket; user approval is pending, so those files remain unstaged. No earlier edits were present.
